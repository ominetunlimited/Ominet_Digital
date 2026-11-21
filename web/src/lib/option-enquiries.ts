"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveContactToList } from "@/lib/contact-capture";
import { rateLimit, actionKey } from "@/lib/rate-limit";
import { getOrCreateAnonKey } from "@/lib/anon-key";
import { queueAlert, adminLink } from "@/lib/notify/telegram";
import { sendTransactional } from "@/lib/mailgun";
import { brandedEmail } from "@/lib/email-template";
import { SITE_URL } from "@/lib/seo";
import { OFFICIAL_EMAIL } from "@/lib/links";
import { MAX_FILES } from "@/lib/enquiry-upload";
import { flavourOf, mapOption, OPTION_COLS, type OptionRow } from "@/lib/service-options";
import { fieldsFor, FLAVOUR_COPY } from "@/lib/service-option-forms";

export type OptionEnquiryInput = {
  serviceSlug: string;
  optionKeys: string[];
  name: string; email: string; phone: string; whatsapp: string; location: string; contactMethod: string;
  values: Record<string, string>;
  consent: boolean;
  newsletterOptIn?: boolean;
  website: string; // honeypot
  uploadIds?: string[];
};
export type OptionEnquiryResult = { ok: true; reference: string; acknowledgementSent: boolean } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
// A customer must never send credentials through a free-text box. Refuse obvious attempts.
const CREDENTIAL_RE = /\b(password|passcode|pin|otp|one[- ]time (?:code|password))\b\s*(?:is|:|=)/i;

function makeRef(prefix: string) {
  const d = new Date();
  return `${prefix}-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}-${randomBytes(4).toString("hex").slice(0, 5).toUpperCase()}`;
}

export async function submitOptionEnquiry(input: OptionEnquiryInput): Promise<OptionEnquiryResult> {
  if (input.website) return { ok: true, reference: "RECEIVED", acknowledgementSent: false };
  if (!rateLimit(await actionKey("option-enquiry"), 5, 10 * 60_000).ok) return { ok: false, error: "Too many requests. Please try again in a few minutes." };
  const flavour = flavourOf(input.serviceSlug);
  if (!flavour) return { ok: false, error: "This service doesn't take requests through this form." };
  const copy = FLAVOUR_COPY[flavour];

  const name = clip(input.name, 120);
  const email = clip(input.email, 200).toLowerCase();
  if (!name) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email address is required so we can reply to you." };
  if (!clip(input.phone, 40) && !clip(input.whatsapp, 40)) return { ok: false, error: "Please give a phone or WhatsApp number." };
  if (!input.consent) return { ok: false, error: "Please tick the box to agree that we may process the information you submit and contact you about it." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: `Requests aren't available right now. Please email ${OFFICIAL_EMAIL}.` };

  const { data: svc } = await admin.from("services").select("id,slug,title,status,booking_enabled").eq("slug", input.serviceSlug).maybeSingle();
  if (!svc || svc.status !== "published" || !svc.booking_enabled) return { ok: false, error: "This service isn't taking requests right now." };

  const keys = Array.from(new Set(input.optionKeys ?? [])).slice(0, 10);
  if (!keys.length) return { ok: false, error: copy.question.replace("?", "") + " is required. Please choose an option." };
  if (!copy.multi && keys.length !== 1) return { ok: false, error: "Please choose one option." };
  const { data: optRows } = await admin.from("service_options").select(OPTION_COLS).eq("service_id", svc.id).eq("active", true).in("key", keys);
  const options = ((optRows ?? []) as OptionRow[]).map(mapOption);
  if (options.length !== keys.length) return { ok: false, error: "One of the selected options is no longer available. Please refresh and try again." };

  // Required fields and the allowed set both come from the server's copy of the form, never from the browser.
  const fields = fieldsFor(flavour, keys);
  const serviceDetails: Record<string, string> = {};
  const raw: Record<string, string> = {};
  for (const f of fields) {
    const v = clip(input.values?.[f.key], f.type === "textarea" ? 2000 : 300);
    if (f.required && !v) return { ok: false, error: `Please fill in: ${f.label}.` };
    if (f.type === "select" && v && !f.options?.includes(v)) return { ok: false, error: `Please choose a valid answer for: ${f.label}.` };
    if (v && CREDENTIAL_RE.test(v)) return { ok: false, error: "Please don't include passwords, PINs or OTPs. We never need them." };
    if (v) { serviceDetails[f.label] = v; raw[f.key] = v; }
  }

  const guestKey = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const tenMin = new Date(Date.now() - 600_000).toISOString();
  const optionIds = options.map((o) => o.id).sort();

  const { data: dup } = await admin.from("bookings").select("reference,service_option_ids").eq("email", email).eq("enquiry_kind", copy.kind).gte("created_at", tenMin).limit(5);
  const same = (dup ?? []).find((d) => JSON.stringify([...(d.service_option_ids as string[])].sort()) === JSON.stringify(optionIds));
  if (same?.reference) return { ok: true, reference: same.reference as string, acknowledgementSent: false };

  const [byGuest, byEmail] = await Promise.all([
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
  ]);
  if ((byGuest.count ?? 0) >= 5 || (byEmail.count ?? 0) >= 5) return { ok: false, error: `You've sent several requests already. Please wait a while, or email ${OFFICIAL_EMAIL}.` };

  const labels = options.map((o) => o.label);
  const durations = options.filter((o) => o.duration).map((o) => (options.length > 1 ? `${o.label}: ${o.duration}` : o.duration!));
  const details = {
    kind: flavour, optionKeys: keys, optionLabels: labels, estimatedDuration: durations.join("; "),
    city: clip(input.location, 120), contactMethod: clip(input.contactMethod, 40), whatsapp: clip(input.whatsapp, 40),
    comments: raw.additional ?? "", consent: true, consentAt: new Date().toISOString(), serviceDetails,
  };

  let reference = makeRef(copy.prefix);
  let id: string | null = null;
  for (let attempt = 0; attempt < 4 && !id; attempt++) {
    const { data, error } = await admin.from("bookings").insert({
      service_id: svc.id, service_title: `${svc.title}: ${labels.join(", ")}`.slice(0, 400), service_ids: [svc.id], service_option_ids: optionIds,
      enquiry_kind: copy.kind, reference, name, email, phone: clip(input.phone || input.whatsapp, 40) || null,
      message: raw.reason ?? raw.changeDetails ?? raw.additional ?? null, details, guest_key: guestKey,
    }).select("id").single();
    if (data) id = data.id as string; else if (error?.code === "23505") reference = makeRef(copy.prefix); else break;
  }
  if (!id) return { ok: false, error: `We couldn't save your request. Please try again, or email ${OFFICIAL_EMAIL}.` };

  const wanted = (input.uploadIds ?? []).filter((u) => /^[0-9a-f-]{36}$/i.test(u)).slice(0, MAX_FILES);
  let fileNames: string[] = [];
  if (wanted.length) {
    const { data: att } = await admin.from("enquiry_uploads").update({ booking_id: id }).in("id", wanted).eq("uploader", guestKey).is("booking_id", null).select("original_name");
    fileNames = (att ?? []).map((a) => a.original_name as string);
  }

  await saveContactToList(admin, { email, name, phone: input.phone || input.whatsapp, source: copy.kind, optIn: input.newsletterOptIn === true });
  await admin.from("analytics_events").insert({ event_type: "booking", metadata: { service_id: svc.id, kind: copy.kind } }).then(() => {}, () => {});
  revalidatePath("/admin/bookings");
  queueAlert("booking", `New ${copy.short} request`, [`Ref: ${reference}`, `Option: ${labels.join(", ")}`, `From: ${name}`], { dedupeKey: `enquiry:${id}`, link: adminLink("/admin/bookings") });

  const received = new Date().toUTCString();
  const common = { Reference: reference, Service: svc.title as string, "Selected option": labels.join(", "), "Estimated processing/effect time": durations.join("; "), "Submitted (UTC)": received };
  const rowsOf = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => [k, v] as [string, string]);
  const internal = brandedEmail({
    siteUrl: SITE_URL, preheader: `New ${copy.short} request ${reference}`, heading: `New ${copy.short} request ${reference}`,
    paragraphs: [`A new ${copy.short} request came in through the website.`],
    rows: [...rowsOf(common), ["Name", name], ["Email", email], ["Phone", input.phone], ["WhatsApp", input.whatsapp], ["Location", details.city], ["Preferred contact", details.contactMethod], ...rowsOf(serviceDetails), ["Attachments", fileNames.join(", ")]],
    button: { label: "Open in admin", href: `${SITE_URL}/admin/bookings` },
  });
  // One reusable acknowledgement for both services. Only the dynamic values and the notice change.
  const ack = brandedEmail({
    siteUrl: SITE_URL, preheader: `We have received your ${copy.short} request.`, heading: `Your ${copy.short} request has been received`,
    paragraphs: [
      `Thank you for contacting Ominet Digital, ${name}.`,
      `We have received your request for ${labels.join(", ")}. Our team will review it and contact you with the next steps, including any additional information we need and a quotation.`,
      copy.notice,
      "This acknowledgement is not a quotation, a booking or a confirmation of any outcome. No payment is due until you have received and accepted a quotation.",
    ],
    rows: [...rowsOf(common), ["Quoted amount", "To be confirmed in your quotation"], ["Payment status", "No payment due yet"], ["Files received", fileNames.join(", ")], ["Contact us", OFFICIAL_EMAIL]],
    button: { label: "Chat on WhatsApp", href: "https://wa.me/2349026057899" },
  });
  const ackSubject = `Your Ominet Digital ${copy.short} request has been received (${reference})`;
  const [r1, r2] = await Promise.all([
    sendTransactional({ to: OFFICIAL_EMAIL, subject: `New ${copy.short} request ${reference}: ${labels.join(", ")}`.slice(0, 200), ...internal, replyTo: email }),
    sendTransactional({ to: email, subject: ackSubject.slice(0, 200), ...ack, replyTo: OFFICIAL_EMAIL }),
  ]);
  const st = (r: typeof r1) => (r.ok ? "accepted" : r.notConfigured ? "not_configured" : "failed");
  await admin.from("email_log").insert([
    { booking_id: id, kind: "enquiry_internal", recipient: OFFICIAL_EMAIL, subject: `New ${copy.short} request ${reference}`.slice(0, 250), r: r1 },
    { booking_id: id, kind: "enquiry_acknowledgement", recipient: email, subject: ackSubject.slice(0, 250), r: r2 },
  ].map(({ r, ...row }) => ({ ...row, status: st(r), provider_id: r.ok ? r.providerId : null, error: r.ok ? null : r.error.slice(0, 300) }))).then(() => {}, () => {});
  await admin.from("bookings").update({ email_status: { internal: st(r1), acknowledgement: st(r2), at: new Date().toISOString() } }).eq("id", id).then(() => {}, () => {});
  return { ok: true, reference, acknowledgementSent: r2.ok };
}
