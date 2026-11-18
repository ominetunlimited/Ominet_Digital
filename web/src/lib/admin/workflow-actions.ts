"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { requireStaff, type StaffSupabase } from "@/lib/auth/guard";
import { sendTransactional, type TransactionalMail } from "@/lib/mailgun";
import {
  STAGES, TRANSITIONS, CONFIRMABLE, CLIENT_NOTIFY_STAGES, stageToStatus, type Stage, type Milestone,
} from "@/lib/workflow";
import { quotationEmail, bookingConfirmedEmail, stageEmail, type QuotationRow, type BookingLite } from "@/lib/workflow-emails";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const dateOrNull = (v: unknown) => { const s = clip(v, 10); return DATE_RE.test(s) ? s : null; };

function ref(prefix: string) {
  const d = new Date();
  return `${prefix}-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}-${randomBytes(4).toString("hex").slice(0, 5).toUpperCase()}`;
}

const BOOKING_COLS = "id,name,email,service_title,reference,booking_ref,details,stage,status,agreed_quotation_id,location,event_date";

async function loadBooking(db: StaffSupabase, id: string) {
  const { data } = await db.from("bookings").select(BOOKING_COLS).eq("id", id).maybeSingle();
  return data as (BookingLite & { stage: Stage; status: string; agreed_quotation_id: string | null; location: string | null; event_date: string | null }) | null;
}
async function loadQuotation(db: StaffSupabase, id: string) {
  const { data } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
  return data as (QuotationRow & { booking_id: string; status: string }) | null;
}

async function event(db: StaffSupabase, bookingId: string, actor: string, kind: string, from: string | null, to: string | null, note?: string) {
  await db.from("enquiry_events").insert({ booking_id: bookingId, kind, from_stage: from, to_stage: to, note: note || null, actor });
}

async function sendLogged(db: StaffSupabase, p: { kind: string; bookingId: string; quotationId?: string; to: string; mail: Omit<TransactionalMail, "to"> }) {
  const res = await sendTransactional({ ...p.mail, to: p.to, replyTo: "info@ominetdigital.com.ng" });
  await db.from("email_log").insert({
    booking_id: p.bookingId, quotation_id: p.quotationId ?? null, kind: p.kind, recipient: p.to, subject: p.mail.subject.slice(0, 250),
    status: res.ok ? "accepted" : res.notConfigured ? "not_configured" : "failed",
    provider_id: res.ok ? res.providerId : null, error: res.ok ? null : res.error.slice(0, 300),
  });
  return res;
}

function emailFailure(res: { ok: false; error: string; notConfigured?: boolean }): string {
  return res.notConfigured
    ? "Email isn't set up yet. Add your Mailgun details in Admin → Newsletter → Mailgun setup, then try again. Nothing was sent."
    : `The email could not be sent (${res.error}). Nothing was marked as sent.`;
}

// ---------------------------------------------------------------- stages

export async function changeStage(bookingId: string, to: Stage, opts: { note?: string; notifyClient?: boolean } = {}): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  if (!STAGES.includes(to)) return { ok: false, error: "Unknown stage." };
  if (to === "booking_confirmed") return { ok: false, error: "Use “Confirm booking” so the agreed quotation is recorded." };
  if (to === "quotation_sent") return { ok: false, error: "Use “Send quotation” so the client actually receives it." };

  const b = await loadBooking(db, bookingId);
  if (!b) return { ok: false, error: "That booking no longer exists." };
  if (!TRANSITIONS[b.stage]?.includes(to)) return { ok: false, error: `A booking can't move from “${b.stage}” to “${to}” directly.` };

  const patch: Record<string, unknown> = { stage: to, updated_at: new Date().toISOString() };
  const status = stageToStatus(to);
  if (status) patch.status = status;
  const { data, error } = await db.from("bookings").update(patch).eq("id", bookingId).eq("stage", b.stage).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "This booking changed while you were working. Refresh and try again." };
  await event(db, bookingId, auth.userId, "stage_change", b.stage, to, opts.note);

  const note = CLIENT_NOTIFY_STAGES[to];
  let message: string | undefined;
  if (note && opts.notifyClient) {
    const mail = stageEmail(b, note, b.booking_ref ?? b.reference ?? "");
    const res = await sendLogged(db, { kind: `stage_${to}`, bookingId, to: b.email, mail });
    message = res.ok ? "Stage updated and the client was emailed." : `Stage updated, but the client email failed: ${res.error}`;
  }
  revalidatePath("/admin/bookings");
  return { ok: true, message };
}

// ---------------------------------------------------------------- quotations

export type QuotationInput = {
  scope: string; price: string; discount: string; currency: string; duration: string; startDate: string; completionDate: string;
  location: string; eventDate: string; deliverables: string; milestones: Milestone[]; paymentTerms: string; revisionTerms: string; conditions: string; expiryDate: string;
};

function toCents(v: string): number | null {
  const n = Number(String(v).replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Saves the working draft; if the latest version has already been sent, starts a new version instead of overwriting it. */
export async function saveQuotation(bookingId: string, input: QuotationInput): Promise<ActionResult & { id?: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const b = await loadBooking(db, bookingId);
  if (!b) return { ok: false, error: "That booking no longer exists." };
  if (["completed", "cancelled", "archived", "booking_confirmed", "in_progress", "awaiting_review"].includes(b.stage)) {
    return { ok: false, error: "This booking is past the quotation stage." };
  }

  const price = toCents(input.price);
  if (price === null || input.price.trim() === "") return { ok: false, error: "Enter the professional fee. Prices are never filled in for you." };
  const discount = input.discount.trim() ? toCents(input.discount) : 0;
  if (discount === null) return { ok: false, error: "The discount isn't a valid amount." };
  if (discount > price) return { ok: false, error: "The discount can't be larger than the fee." };
  const currency = clip(input.currency, 3).toUpperCase() || "NGN";
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Currency must be a 3-letter code such as NGN." };

  const milestones = (Array.isArray(input.milestones) ? input.milestones : []).slice(0, 12)
    .map((m) => ({ title: clip(m?.title, 160), due: clip(m?.due, 60), amount: clip(m?.amount, 60) })).filter((m) => m.title);

  const row = {
    scope: clip(input.scope, 4000) || null, price_cents: price, discount_cents: discount, currency,
    duration: clip(input.duration, 200) || null, start_date: dateOrNull(input.startDate), completion_date: dateOrNull(input.completionDate),
    location: clip(input.location, 200) || null, event_date: dateOrNull(input.eventDate), deliverables: clip(input.deliverables, 4000) || null,
    milestones, payment_terms: clip(input.paymentTerms, 2000) || null, revision_terms: clip(input.revisionTerms, 1000) || null,
    conditions: clip(input.conditions, 3000) || null, expiry_date: dateOrNull(input.expiryDate), updated_at: new Date().toISOString(),
  };

  const { data: latest } = await db.from("quotations").select("id,reference,version,status").eq("booking_id", bookingId).order("version", { ascending: false }).limit(1).maybeSingle();

  if (latest && latest.status === "draft") {
    const { error } = await db.from("quotations").update(row).eq("id", latest.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bookings");
    return { ok: true, id: latest.id as string, message: "Draft saved." };
  }
  const { data: created, error } = await db.from("quotations").insert({
    ...row, booking_id: bookingId, reference: latest?.reference ?? ref("QUO"), version: (latest?.version ?? 0) + 1, status: "draft", created_by: auth.userId,
  }).select("id").single();
  if (error || !created) return { ok: false, error: error?.message ?? "Couldn't save the quotation." };
  if (["new_enquiry", "under_review", "awaiting_info"].includes(b.stage)) {
    await db.from("bookings").update({ stage: "quotation_prepared", updated_at: new Date().toISOString() }).eq("id", bookingId);
    await event(db, bookingId, auth.userId, "stage_change", b.stage, "quotation_prepared", "Quotation drafted");
  } else if (["quotation_sent", "negotiation", "awaiting_acceptance", "awaiting_payment"].includes(b.stage)) {
    await db.from("bookings").update({ stage: "quotation_prepared", updated_at: new Date().toISOString() }).eq("id", bookingId);
    await event(db, bookingId, auth.userId, "stage_change", b.stage, "quotation_prepared", `Revision v${(latest?.version ?? 0) + 1} drafted`);
  }
  revalidatePath("/admin/bookings");
  return { ok: true, id: created.id as string, message: latest ? `Version ${latest.version + 1} drafted. The earlier version is kept.` : "Draft saved." };
}

export async function sendQuotation(quotationId: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const q = await loadQuotation(db, quotationId);
  if (!q) return { ok: false, error: "That quotation no longer exists." };
  if (q.status !== "draft") return { ok: false, error: "Only a draft can be sent. Edit the quotation to start a new version." };
  if (!q.deliverables && !q.scope) return { ok: false, error: "Add the scope or deliverables before sending." };
  if (!q.completion_date && !q.duration) return { ok: false, error: "Add an estimated duration or completion date before sending." };
  const b = await loadBooking(db, q.booking_id);
  if (!b) return { ok: false, error: "The booking no longer exists." };

  const { data: previous } = await db.from("quotations").select("id").eq("booking_id", q.booking_id).eq("status", "sent");
  const mail = quotationEmail(q, b, q.version > 1);
  const res = await sendLogged(db, { kind: "quotation", bookingId: b.id, quotationId: q.id, to: b.email, mail });
  if (!res.ok) return { ok: false, error: emailFailure(res) };

  const now = new Date().toISOString();
  await db.from("quotations").update({ status: "sent", sent_at: now, updated_at: now }).eq("id", q.id);
  if (previous?.length) await db.from("quotations").update({ status: "superseded", updated_at: now }).in("id", previous.map((p) => p.id as string));
  await db.from("bookings").update({ stage: "quotation_sent", status: "pending", updated_at: now }).eq("id", b.id);
  await event(db, b.id, auth.userId, "quotation_sent", b.stage, "quotation_sent", `${q.reference} v${q.version} sent to the client`);
  revalidatePath("/admin/bookings");
  return { ok: true, message: `Quotation ${q.reference} (v${q.version}) emailed to ${b.email}.` };
}

export async function recordQuotationResponse(quotationId: string, response: "accepted" | "declined"): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const q = await loadQuotation(db, quotationId);
  if (!q) return { ok: false, error: "That quotation no longer exists." };
  if (q.status !== "sent") return { ok: false, error: "Only a quotation that has been sent can receive a response." };
  const b = await loadBooking(db, q.booking_id);
  if (!b) return { ok: false, error: "The booking no longer exists." };
  const now = new Date().toISOString();
  await db.from("quotations").update({ status: response, responded_at: now, updated_at: now }).eq("id", q.id);
  if (response === "declined") {
    await db.from("bookings").update({ stage: "negotiation", updated_at: now }).eq("id", b.id);
    await event(db, b.id, auth.userId, "quotation_declined", b.stage, "negotiation", `${q.reference} v${q.version} declined by the client`);
  } else {
    await event(db, b.id, auth.userId, "quotation_accepted", b.stage, b.stage, `${q.reference} v${q.version} accepted by the client`);
  }
  revalidatePath("/admin/bookings");
  return { ok: true, message: response === "accepted" ? "Recorded as accepted. You can now confirm the booking." : "Recorded as declined. Revise the quotation to continue." };
}

// ---------------------------------------------------------------- booking confirmation

export async function confirmBooking(bookingId: string, paymentStatus: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const b = await loadBooking(db, bookingId);
  if (!b) return { ok: false, error: "That booking no longer exists." };
  if (!CONFIRMABLE.includes(b.stage)) return { ok: false, error: "A booking can only be confirmed after a quotation has been sent." };
  const { data: accepted } = await db.from("quotations").select("*").eq("booking_id", bookingId).eq("status", "accepted").order("version", { ascending: false }).limit(1).maybeSingle();
  if (!accepted) return { ok: false, error: "Record the client's acceptance of a quotation first. A booking is not confirmed just because a quotation was sent." };
  const q = accepted as QuotationRow;

  const bookingRef = b.booking_ref ?? ref("BKG");
  const pay = clip(paymentStatus, 120) || "No payment recorded yet";
  const mail = bookingConfirmedEmail(q, b, bookingRef, pay);
  const res = await sendLogged(db, { kind: "booking_confirmed", bookingId, quotationId: q.id, to: b.email, mail });
  if (!res.ok) return { ok: false, error: emailFailure(res) };

  const now = new Date().toISOString();
  await db.from("bookings").update({
    stage: "booking_confirmed", status: "confirmed", booking_ref: bookingRef, agreed_quotation_id: q.id,
    location: q.location, event_date: q.event_date, confirmed_date: q.start_date, updated_at: now,
  }).eq("id", bookingId);
  await event(db, bookingId, auth.userId, "booking_confirmed", b.stage, "booking_confirmed", `${bookingRef} on ${q.reference} v${q.version}`);
  revalidatePath("/admin/bookings");
  return { ok: true, message: `Booking ${bookingRef} confirmed and the client emailed.` };
}

// ---------------------------------------------------------------- email retry

export async function retryEmail(logId: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const { data: log } = await db.from("email_log").select("id,kind,status,booking_id,quotation_id").eq("id", logId).maybeSingle();
  if (!log) return { ok: false, error: "That log entry no longer exists." };
  if (log.status === "accepted") return { ok: false, error: "That email was already accepted by Mailgun." };
  if (!log.booking_id) return { ok: false, error: "The booking for this email no longer exists." };
  const b = await loadBooking(db, log.booking_id as string);
  if (!b) return { ok: false, error: "The booking for this email no longer exists." };

  let mail: Omit<TransactionalMail, "to"> | null = null;
  const q = log.quotation_id ? await loadQuotation(db, log.quotation_id as string) : null;
  if (log.kind === "quotation" && q) mail = quotationEmail(q, b, q.version > 1);
  else if (log.kind === "booking_confirmed" && q && b.booking_ref) mail = bookingConfirmedEmail(q, b, b.booking_ref, "As recorded at confirmation");
  else if (String(log.kind).startsWith("stage_")) {
    const note = CLIENT_NOTIFY_STAGES[String(log.kind).slice(6) as Stage];
    if (note) mail = stageEmail(b, note, b.booking_ref ?? b.reference ?? "");
  }
  if (!mail) return { ok: false, error: "This kind of email can't be retried automatically." };
  const res = await sendLogged(db, { kind: String(log.kind), bookingId: b.id, quotationId: q?.id, to: b.email, mail });
  revalidatePath("/admin/email-activity");
  return res.ok ? { ok: true, message: "Resent. Mailgun accepted it." } : { ok: false, error: emailFailure(res) };
}
