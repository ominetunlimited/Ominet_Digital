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
import { groupForService } from "@/lib/enquiry-fields";
import { MAX_FILES } from "@/lib/enquiry-upload";

export type EnquiryInput = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  country: string;
  city: string;
  projectTitle: string;
  serviceIds: string[];
  summary: string;
  requirements: string;
  deliverables: string;
  deliveryDate: string; // yyyy-mm-dd or free text timeline
  startDate: string;
  budget: string;
  contactMethod: string;
  heardFrom: string;
  comments: string;
  consent: boolean;
  newsletterOptIn?: boolean;
  serviceDetails: Record<string, string>;
  website: string; // honeypot
  uploadIds?: string[]; // files already uploaded through /api/enquiry-upload
};

export type EnquiryResult =
  | { ok: true; reference: string; acknowledgementSent: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

function makeReference(): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const rand = randomBytes(4).toString("hex").slice(0, 5).toUpperCase();
  return `ODP-${ym}-${rand}`;
}

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  if (input.website) return { ok: true, reference: "RECEIVED", acknowledgementSent: false };
  if (!rateLimit(await actionKey("enquiry"), 5, 10 * 60_000).ok) return { ok: false, error: "Too many requests. Please try again in a few minutes." };

  const name = clip(input.name, 120);
  const email = clip(input.email, 200).toLowerCase();
  const projectTitle = clip(input.projectTitle, 160);
  const summary = clip(input.summary, 2000);
  const requirements = clip(input.requirements, 4000);
  const deliverables = clip(input.deliverables, 2000);
  const timeline = clip(input.deliveryDate, 120);

  if (!name) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email address is required so we can reply to you." };
  if (!projectTitle) return { ok: false, error: "Please give your project a title or subject." };
  if (!input.serviceIds?.length) return { ok: false, error: "Please choose at least one service." };
  if (input.serviceIds.length > 10) return { ok: false, error: "Please choose up to ten services." };
  if (summary.length < 20) return { ok: false, error: "Please describe the project in a few sentences (at least 20 characters)." };
  if (!deliverables) return { ok: false, error: "Please tell us the deliverables you expect." };
  if (!timeline) return { ok: false, error: "Please give a preferred delivery date or timeline." };
  if (!input.consent) return { ok: false, error: "Please tick the box to confirm we may contact you about this enquiry." };
  if (input.startDate && !DATE_RE.test(input.startDate)) return { ok: false, error: "The project start date isn't valid." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: `Enquiries aren't available right now. Please email ${OFFICIAL_EMAIL}.` };

  const { data: services } = await admin
    .from("services")
    .select("id,slug,title")
    .in("id", input.serviceIds)
    .eq("status", "published");
  if (!services?.length || services.length !== new Set(input.serviceIds).size) {
    return { ok: false, error: "One of the selected services is no longer available. Please refresh and try again." };
  }

  // Only keep detail fields that belong to a selected service (never trust the client's keys).
  const allowed = new Set<string>();
  for (const s of services) groupForService(s)?.fields.forEach((f) => allowed.add(f.key));
  const serviceDetails: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.serviceDetails ?? {})) {
    if (allowed.has(k) && String(v).trim()) serviceDetails[k] = clip(v, 600);
  }

  const guestKey = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const tenMin = new Date(Date.now() - 600_000).toISOString();

  // Duplicate protection: same person, same project title, last ten minutes.
  const { data: dup } = await admin
    .from("bookings")
    .select("reference")
    .eq("email", email)
    .eq("enquiry_kind", "project_enquiry")
    .eq("details->>projectTitle", projectTitle)
    .gte("created_at", tenMin)
    .limit(1)
    .maybeSingle();
  if (dup?.reference) return { ok: true, reference: dup.reference as string, acknowledgementSent: false };

  const [byGuest, byEmail] = await Promise.all([
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
  ]);
  if ((byGuest.count ?? 0) >= 5 || (byEmail.count ?? 0) >= 5) {
    return { ok: false, error: `You've sent several enquiries already. Please wait a while, or email ${OFFICIAL_EMAIL}.` };
  }

  const serviceTitles = services.map((s) => s.title as string);
  const details = {
    projectTitle,
    organisation: clip(input.organisation, 160),
    country: clip(input.country, 80),
    city: clip(input.city, 80),
    requirements,
    deliverables,
    deliveryTimeline: timeline,
    startDate: input.startDate || "",
    budget: clip(input.budget, 80),
    contactMethod: clip(input.contactMethod, 40),
    heardFrom: clip(input.heardFrom, 120),
    comments: clip(input.comments, 1500),
    consent: true,
    serviceDetails,
  };

  let reference = makeReference();
  let id: string | null = null;
  for (let attempt = 0; attempt < 4 && !id; attempt++) {
    const { data, error } = await admin
      .from("bookings")
      .insert({
        service_id: services[0].id,
        service_title: serviceTitles.join(", ").slice(0, 400),
        service_ids: services.map((s) => s.id),
        enquiry_kind: "project_enquiry",
        reference,
        name,
        email,
        phone: clip(input.phone, 40) || null,
        preferred_date: DATE_RE.test(timeline) ? timeline : null,
        message: summary,
        details,
        guest_key: guestKey,
      })
      .select("id")
      .single();
    if (data) id = data.id as string;
    else if (error?.code === "23505") reference = makeReference();
    else break;
  }
  if (!id) return { ok: false, error: `We couldn't save your enquiry. Please try again, or email ${OFFICIAL_EMAIL}.` };

  // Attach files this visitor uploaded earlier. Only their own, still-unattached uploads can be claimed.
  const wanted = (input.uploadIds ?? []).filter((u) => /^[0-9a-f-]{36}$/i.test(u)).slice(0, MAX_FILES);
  let fileNames: string[] = [];
  if (wanted.length) {
    const { data: att } = await admin.from("enquiry_uploads").update({ booking_id: id }).in("id", wanted).eq("uploader", guestKey).is("booking_id", null).select("original_name");
    fileNames = (att ?? []).map((a) => a.original_name as string);
  }

  await saveContactToList(admin, { email, name, phone: input.phone, source: "project_enquiry", optIn: input.newsletterOptIn === true });
  await admin.from("analytics_events").insert({ event_type: "booking", metadata: { service_id: services[0].id, kind: "project_enquiry" } }).then(() => {}, () => {});
  revalidatePath("/admin/bookings");
  queueAlert("booking", "New project enquiry", [`Ref: ${reference}`, `Services: ${serviceTitles.join(", ")}`, `From: ${name}`], { dedupeKey: `enquiry:${id}`, link: adminLink("/admin/bookings") });

  // Emails never decide whether the enquiry succeeded. Their outcome is recorded honestly:
  // "accepted" = Mailgun took it; it is not proof of inbox delivery.
  const received = new Date().toUTCString();
  const internal = brandedEmail({
    siteUrl: SITE_URL,
    preheader: `New project enquiry ${reference}`,
    heading: `New project enquiry ${reference}`,
    paragraphs: ["A new enquiry came in through the Discuss a Project page."],
    rows: [
      ["Reference", reference], ["Name", name], ["Email", email], ["Phone / WhatsApp", input.phone], ["Organisation", details.organisation],
      ["Location", [details.city, details.country].filter(Boolean).join(", ")],
      ["Project", projectTitle], ["Services", serviceTitles.join(", ")], ["Summary", summary], ["Requirements", requirements],
      ["Attachments", fileNames.join(", ")], ["Deliverables", deliverables], ["Delivery timeline", timeline], ["Start date", details.startDate], ["Budget", details.budget],
      ["Preferred contact", details.contactMethod], ["Heard about us", details.heardFrom], ["Comments", details.comments],
      ...Object.entries(serviceDetails).map(([k, v]) => [k, v] as [string, string]),
      ["Received (UTC)", received],
    ],
    button: { label: "Open in admin", href: `${SITE_URL}/admin/bookings` },
  });
  const ack = brandedEmail({
    siteUrl: SITE_URL,
    preheader: "We have received your project enquiry.",
    heading: "Your project enquiry has been received",
    paragraphs: [
      `Thank you for contacting Ominet Digital, ${name}.`,
      "We have received your enquiry and our team will review the project details. Following our assessment, we will contact you with next steps, including the proposed scope, quotation and delivery arrangements.",
      "Please note that this acknowledgement is not a confirmed quotation or booking. Final pricing, delivery dates and project arrangements will be agreed with you before work begins.",
    ],
    rows: [["Enquiry reference", reference], ["Project", projectTitle], ["Services", serviceTitles.join(", ")], ["Files received", fileNames.join(", ")], ["Summary", summary], ["Received (UTC)", received]],
    button: { label: "Chat on WhatsApp", href: "https://wa.me/2349026057899" },
  });

  const [r1, r2] = await Promise.all([
    sendTransactional({ to: OFFICIAL_EMAIL, subject: `New project enquiry ${reference}: ${projectTitle}`.slice(0, 200), ...internal, replyTo: email }),
    sendTransactional({ to: email, subject: "Your Ominet Digital Quotation Request Has Been Received", ...ack, replyTo: OFFICIAL_EMAIL }),
  ]);
  await admin.from("email_log").insert([
    { booking_id: id, kind: "enquiry_internal", recipient: OFFICIAL_EMAIL, subject: `New project enquiry ${reference}`.slice(0, 250), r: r1 },
    { booking_id: id, kind: "enquiry_acknowledgement", recipient: email, subject: "Your Ominet Digital Quotation Request Has Been Received", r: r2 },
  ].map(({ r, ...row }) => ({ ...row, status: r.ok ? "accepted" : r.notConfigured ? "not_configured" : "failed", provider_id: r.ok ? r.providerId : null, error: r.ok ? null : r.error.slice(0, 300) }))).then(() => {}, () => {});
  const status = (r: typeof r1) => (r.ok ? "accepted" : r.notConfigured ? "not_configured" : "failed");
  await admin
    .from("bookings")
    .update({ email_status: { internal: status(r1), acknowledgement: status(r2), at: new Date().toISOString(), errors: [r1, r2].filter((r) => !r.ok).map((r) => (r.ok ? "" : r.error.slice(0, 160))) } })
    .eq("id", id)
    .then(() => {}, () => {});

  return { ok: true, reference, acknowledgementSent: r2.ok };
}
