"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff, type StaffSupabase } from "@/lib/auth/guard";
import { sendTransactional } from "@/lib/mailgun";
import { brandedEmail } from "@/lib/email-template";
import { SITE_URL } from "@/lib/seo";
import { sanitizeRichHtml } from "@/lib/rich-text";
import { renderDocumentPdf } from "@/lib/document-pdf";
import {
  DOC_KINDS, DOC_LABEL, PLACEHOLDER_RE, buildData, buildDocument, docMoney, net, paidTotal,
  type DocBooking, type DocData, type DocKind, type DocPayment, type DocQuote,
} from "@/lib/documents";

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const BOOKING_COLS = "id,name,email,phone,service_title,reference,booking_ref,details,stage,agreed_quotation_id";

type Ctx = { booking: DocBooking & { stage: string; agreed_quotation_id: string | null }; accepted: DocQuote | null; payments: DocPayment[] };

async function loadCtx(db: StaffSupabase, bookingId: string): Promise<Ctx | null> {
  const { data: booking } = await db.from("bookings").select(BOOKING_COLS).eq("id", bookingId).maybeSingle();
  if (!booking) return null;
  const b = booking as Ctx["booking"];
  let accepted: DocQuote | null = null;
  if (b.agreed_quotation_id) {
    const { data } = await db.from("quotations").select("*").eq("id", b.agreed_quotation_id).maybeSingle();
    accepted = (data as DocQuote | null) ?? null;
  }
  if (!accepted) {
    const { data } = await db.from("quotations").select("*").eq("booking_id", bookingId).eq("status", "accepted").order("version", { ascending: false }).limit(1).maybeSingle();
    accepted = (data as DocQuote | null) ?? null;
  }
  const { data: pays } = await db.from("booking_payments").select("id,kind,amount_cents,currency,method,reference,paid_on,note,status,created_at").eq("booking_id", bookingId).order("created_at", { ascending: true });
  return { booking: b, accepted, payments: (pays ?? []) as DocPayment[] };
}

async function logEvent(db: StaffSupabase, bookingId: string, actor: string, kind: string, note: string) {
  await db.from("enquiry_events").insert({ booking_id: bookingId, kind, note: note.slice(0, 500), actor });
}

const refresh = (bookingId?: string) => { revalidatePath("/admin/bookings"); revalidatePath("/admin/documents"); if (bookingId) revalidatePath(`/admin/documents`); };

// ---------------------------------------------------------------- payments

export type PaymentInput = { kind: "deposit" | "instalment" | "balance" | "full"; amount: string; method: string; reference: string; paidOn: string; note: string };

export async function recordPayment(bookingId: string, input: PaymentInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const ctx = await loadCtx(db, bookingId);
  if (!ctx) return { ok: false, error: "That booking no longer exists." };
  if (!ctx.accepted) return { ok: false, error: "Payments are recorded against an accepted quotation. Record the client's acceptance first." };

  const major = Number(String(input.amount).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(major) || major <= 0) return { ok: false, error: "Enter the amount received, as a number above zero." };
  const cents = Math.round(major * 100);
  const total = net(ctx.accepted);
  const outstanding = total - paidTotal(ctx.payments);
  if (cents > outstanding) return { ok: false, error: `That is more than the outstanding balance of ${docMoney(outstanding, ctx.accepted.currency)}. Check the amount, or revise the quotation if the fee changed.` };
  const paidOn = DATE_RE.test(input.paidOn) ? input.paidOn : null;
  if (!paidOn) return { ok: false, error: "Choose the date the payment was received." };
  if (new Date(`${paidOn}T00:00:00Z`).getTime() > Date.now() + 86_400_000) return { ok: false, error: "The payment date cannot be in the future." };
  const kind = (["deposit", "instalment", "balance", "full"] as const).includes(input.kind) ? input.kind : "instalment";

  const { data: pay, error } = await db.from("booking_payments").insert({
    booking_id: bookingId, quotation_id: ctx.accepted.id, kind, amount_cents: cents, currency: ctx.accepted.currency,
    method: clip(input.method, 80) || null, reference: clip(input.reference, 120) || null, paid_on: paidOn, note: clip(input.note, 300) || null, recorded_by: auth.userId,
  }).select("id,kind,amount_cents,currency,method,reference,paid_on,note,status,created_at").single();
  if (error || !pay) return { ok: false, error: "The payment could not be saved. Nothing was recorded." };

  // A receipt exists only because money was recorded, so it is created here as a draft for review.
  const created = await createDocumentInternal(db, auth.userId, ctx, "receipt", { payment: pay as DocPayment });
  await logEvent(db, bookingId, auth.userId, "payment_recorded", `${docMoney(cents, ctx.accepted.currency)} (${kind})${input.reference ? `, ref ${clip(input.reference, 60)}` : ""}`);
  refresh(bookingId);
  const left = outstanding - cents;
  return { ok: true, id: created.ok ? created.id : undefined, message: `Payment recorded. ${left > 0 ? `Outstanding: ${docMoney(left, ctx.accepted.currency)}.` : "Fully paid."}${created.ok ? " A draft receipt is ready to review and issue." : ""}` };
}

export async function voidPayment(paymentId: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const why = clip(reason, 200);
  if (!why) return { ok: false, error: "Say why this payment is being voided. It is kept in the record." };
  const { data: pay } = await db.from("booking_payments").select("id,booking_id,status,amount_cents,currency").eq("id", paymentId).maybeSingle();
  if (!pay) return { ok: false, error: "That payment no longer exists." };
  if (pay.status === "voided") return { ok: false, error: "That payment is already voided." };
  await db.from("booking_payments").update({ status: "voided", note: why }).eq("id", paymentId);
  await db.from("documents").update({ status: "void", updated_at: new Date().toISOString() }).eq("payment_id", paymentId).neq("status", "void");
  await logEvent(db, pay.booking_id, auth.userId, "payment_voided", `${docMoney(Number(pay.amount_cents), pay.currency)}: ${why}`);
  refresh(pay.booking_id);
  return { ok: true, message: "Payment voided. Any receipt for it was voided too." };
}

// ---------------------------------------------------------------- documents

async function createDocumentInternal(db: StaffSupabase, userId: string, ctx: Ctx, kind: DocKind, opts: { quotation?: DocQuote | null; payment?: DocPayment | null }): Promise<ActionResult> {
  const quote = opts.quotation ?? ctx.accepted;
  if (kind === "quotation") { if (!quote) return { ok: false, error: "Choose a quotation to produce." }; }
  else if (kind === "receipt") {
    if (!opts.payment || opts.payment.status !== "recorded") return { ok: false, error: "A receipt can only be made for a recorded payment." };
  } else if (!ctx.accepted) return { ok: false, error: `A ${DOC_LABEL[kind].toLowerCase()} needs an accepted quotation first.` };
  if (kind === "completion_note" && !["awaiting_review", "completed"].includes(ctx.booking.stage)) return { ok: false, error: "A completion note is made once the work is awaiting review or completed." };

  if (kind === "receipt" && opts.payment) {
    const { data: existing } = await db.from("documents").select("id").eq("payment_id", opts.payment.id).eq("kind", "receipt").neq("status", "void").limit(1);
    if (existing?.length) return { ok: false, error: "A receipt already exists for that payment." };
  }
  const built = buildDocument({ kind, booking: ctx.booking, quote, payments: ctx.payments, payment: opts.payment ?? null });
  const { data: number, error: numErr } = await db.rpc("next_document_number", { p_kind: kind });
  if (numErr || !number) return { ok: false, error: "Could not reserve a document number. Nothing was created." };
  const { data: doc, error } = await db.from("documents").insert({
    booking_id: ctx.booking.id, quotation_id: quote?.id ?? null, payment_id: opts.payment?.id ?? null, kind, number: number as string,
    title: built.title, intro_html: sanitizeRichHtml(built.intro_html), body_html: sanitizeRichHtml(built.body_html), footer_html: sanitizeRichHtml(built.footer_html), data: built.data, created_by: userId,
  }).select("id").single();
  if (error || !doc) return { ok: false, error: "The document could not be saved." };
  await logEvent(db, ctx.booking.id, userId, "document_created", `${DOC_LABEL[kind]} ${number}`);
  return { ok: true, id: doc.id as string, message: `${DOC_LABEL[kind]} ${number} created as a draft.` };
}

export async function createDocument(bookingId: string, kind: DocKind, opts: { quotationId?: string; paymentId?: string } = {}): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!DOC_KINDS.includes(kind)) return { ok: false, error: "Unknown document type." };
  const db = auth.supabase;
  const ctx = await loadCtx(db, bookingId);
  if (!ctx) return { ok: false, error: "That booking no longer exists." };
  let quotation: DocQuote | null = null;
  if (opts.quotationId) {
    const { data } = await db.from("quotations").select("*").eq("id", opts.quotationId).eq("booking_id", bookingId).maybeSingle();
    quotation = (data as DocQuote | null) ?? null;
    if (!quotation) return { ok: false, error: "That quotation does not belong to this booking." };
  }
  const payment = opts.paymentId ? ctx.payments.find((p) => p.id === opts.paymentId) ?? null : null;
  const res = await createDocumentInternal(db, auth.userId, ctx, kind, { quotation, payment });
  refresh(bookingId);
  return res;
}

export type DocEdit = { title: string; introHtml: string; bodyHtml: string; footerHtml: string };

async function loadDoc(db: StaffSupabase, id: string) {
  const { data } = await db.from("documents").select("*").eq("id", id).maybeSingle();
  return data as { id: string; booking_id: string; quotation_id: string | null; payment_id: string | null; kind: DocKind; number: string; status: "draft" | "issued" | "void"; title: string; intro_html: string; body_html: string; footer_html: string; data: DocData; issued_at: string | null; created_at: string } | null;
}

export async function saveDocument(id: string, edit: DocEdit): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const doc = await loadDoc(db, id);
  if (!doc) return { ok: false, error: "That document no longer exists." };
  if (doc.status !== "draft") return { ok: false, error: "Only drafts can be edited. Void this document and create a new one to change it." };
  const title = clip(edit.title, 120);
  if (!title) return { ok: false, error: "The document needs a title." };
  const { error } = await db.from("documents").update({
    title, intro_html: sanitizeRichHtml(edit.introHtml), body_html: sanitizeRichHtml(edit.bodyHtml), footer_html: sanitizeRichHtml(edit.footerHtml), updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { ok: false, error: "The changes could not be saved." };
  refresh(doc.booking_id);
  return { ok: true, message: "Draft saved." };
}

/** Re-reads the quotation and payments so the figures on a draft match the record. The wording you edited is not touched. */
export async function refreshDocumentFigures(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const doc = await loadDoc(db, id);
  if (!doc) return { ok: false, error: "That document no longer exists." };
  if (doc.status !== "draft") return { ok: false, error: "Issued documents are fixed. Void and recreate to change figures." };
  const ctx = await loadCtx(db, doc.booking_id);
  if (!ctx) return { ok: false, error: "That booking no longer exists." };
  let quote = ctx.accepted;
  if (doc.quotation_id) {
    const { data } = await db.from("quotations").select("*").eq("id", doc.quotation_id).maybeSingle();
    quote = (data as DocQuote | null) ?? quote;
  }
  const payment = doc.payment_id ? ctx.payments.find((p) => p.id === doc.payment_id) ?? null : null;
  const data = buildData({ kind: doc.kind, booking: ctx.booking, quote, payments: ctx.payments, payment });
  await db.from("documents").update({ data, updated_at: new Date().toISOString() }).eq("id", id);
  refresh(doc.booking_id);
  return { ok: true, message: "Figures refreshed from the latest quotation and payments." };
}

export async function issueDocument(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const doc = await loadDoc(db, id);
  if (!doc) return { ok: false, error: "That document no longer exists." };
  if (doc.status !== "draft") return { ok: false, error: "Only a draft can be issued." };
  if ([doc.intro_html, doc.body_html, doc.footer_html].some((h) => PLACEHOLDER_RE.test(h))) return { ok: false, error: "There is still a [[placeholder]] in the text. Fill it in or delete it before issuing." };
  if (doc.kind === "receipt") {
    const { data: pay } = await db.from("booking_payments").select("status").eq("id", doc.payment_id ?? "").maybeSingle();
    if (!pay || pay.status !== "recorded") return { ok: false, error: "This receipt's payment is not a recorded payment, so it cannot be issued." };
  }
  const { error } = await db.from("documents").update({ status: "issued", issued_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) return { ok: false, error: "Could not issue the document." };
  await logEvent(db, doc.booking_id, auth.userId, "document_issued", `${DOC_LABEL[doc.kind]} ${doc.number}`);
  refresh(doc.booking_id);
  return { ok: true, message: `${doc.number} issued. It can no longer be edited.` };
}

export async function voidDocument(id: string, reason: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const doc = await loadDoc(db, id);
  if (!doc) return { ok: false, error: "That document no longer exists." };
  if (doc.status === "void") return { ok: false, error: "Already void." };
  const why = clip(reason, 200);
  if (!why) return { ok: false, error: "Say why it is being voided." };
  await db.from("documents").update({ status: "void", updated_at: new Date().toISOString() }).eq("id", id);
  await logEvent(db, doc.booking_id, auth.userId, "document_voided", `${doc.number}: ${why}`);
  refresh(doc.booking_id);
  return { ok: true, message: `${doc.number} voided. The number is kept for the record.` };
}

export async function emailDocument(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const db = auth.supabase;
  const doc = await loadDoc(db, id);
  if (!doc) return { ok: false, error: "That document no longer exists." };
  if (doc.status !== "issued") return { ok: false, error: "Issue the document before emailing it to the client." };
  const { data: b } = await db.from("bookings").select("name,email").eq("id", doc.booking_id).maybeSingle();
  if (!b?.email) return { ok: false, error: "This booking has no client email address." };

  const pdf = await renderDocumentPdf({ title: doc.title, number: doc.number, status: doc.status, issuedAt: doc.issued_at, createdAt: doc.created_at, introHtml: doc.intro_html, bodyHtml: doc.body_html, footerHtml: doc.footer_html, data: doc.data });
  const label = DOC_LABEL[doc.kind];
  const subject = `${label} ${doc.number} from Ominet Digital`;
  const { html, text } = brandedEmail({
    siteUrl: SITE_URL, preheader: `${label} ${doc.number} attached`, heading: label,
    paragraphs: [`Dear ${b.name},`, `Please find your ${label.toLowerCase()} attached as a PDF (${doc.number}). If anything looks wrong, reply to this email and we will correct it.`],
    rows: [["Document", `${label} ${doc.number}`], ["Project", doc.data.project]],
  });
  const res = await sendTransactional({ to: b.email, subject, html, text, replyTo: "info@ominetdigital.com.ng", attachments: [{ filename: `${doc.number}.pdf`, content: pdf, contentType: "application/pdf" }] });
  await db.from("email_log").insert({
    booking_id: doc.booking_id, kind: `document_${doc.kind}`, recipient: b.email, subject: subject.slice(0, 250),
    status: res.ok ? "accepted" : res.notConfigured ? "not_configured" : "failed", provider_id: res.ok ? res.providerId : null, error: res.ok ? null : res.error.slice(0, 300),
  });
  if (!res.ok) return { ok: false, error: res.notConfigured ? "Email isn't set up yet, so nothing was sent. Add your Mailgun details first." : `The email could not be sent (${res.error}).` };
  await logEvent(db, doc.booking_id, auth.userId, "document_emailed", `${doc.number} to ${b.email}`);
  refresh(doc.booking_id);
  return { ok: true, message: `${doc.number} emailed to ${b.email}.` };
}
