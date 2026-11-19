import { brandedEmail, type EmailRow } from "@/lib/email-template";
import { SITE_URL } from "@/lib/seo";
import { formatMoney } from "@/lib/money";
import type { Milestone } from "@/lib/workflow";

export type QuotationRow = {
  id: string; reference: string; version: number; scope: string | null; price_cents: number; discount_cents: number; currency: string;
  duration: string | null; start_date: string | null; completion_date: string | null; location: string | null; event_date: string | null;
  deliverables: string | null; milestones: Milestone[]; payment_terms: string | null; revision_terms: string | null; conditions: string | null; expiry_date: string | null;
};
export type BookingLite = { id: string; name: string; email: string; service_title: string; reference: string | null; booking_ref: string | null; details: Record<string, unknown> | null };

const fmtDate = (d: string | null) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null);
const projectOf = (b: BookingLite) => (typeof b.details?.projectTitle === "string" ? (b.details.projectTitle as string) : b.service_title);

export function netAmount(q: Pick<QuotationRow, "price_cents" | "discount_cents">): number {
  return Math.max(0, Number(q.price_cents) - Number(q.discount_cents));
}

export function quotationRows(q: QuotationRow, b: BookingLite): EmailRow[] {
  const total = netAmount(q);
  return [
    ["Quotation reference", `${q.reference}${q.version > 1 ? ` (version ${q.version})` : ""}`],
    ["Enquiry reference", b.reference],
    ["Project", projectOf(b)],
    ["Service", b.service_title],
    ["Agreed scope", q.scope],
    ["Deliverables", q.deliverables],
    ["Professional fee", formatMoney(Number(q.price_cents), q.currency)],
    ["Discount", Number(q.discount_cents) > 0 ? `-${formatMoney(Number(q.discount_cents), q.currency)}` : null],
    ["Total", Number(q.discount_cents) > 0 ? formatMoney(total, q.currency) : null],
    ["Currency", q.currency],
    ["Estimated duration", q.duration],
    ["Proposed start date", fmtDate(q.start_date)],
    ["Proposed completion date", fmtDate(q.completion_date)],
    ["Location", q.location],
    ["Event date", fmtDate(q.event_date)],
    ["Milestones", q.milestones?.length ? q.milestones.map((m, i) => `${i + 1}. ${m.title}${m.due ? ` (${m.due})` : ""}${m.amount ? ` - ${m.amount}` : ""}`).join("\n") : null],
    ["Payment schedule", q.payment_terms],
    ["Revision arrangements", q.revision_terms],
    ["Additional conditions", q.conditions],
    ["Valid until", fmtDate(q.expiry_date)],
  ];
}

export function quotationEmail(q: QuotationRow, b: BookingLite, revised: boolean) {
  return {
    subject: revised ? `Updated Quotation ${q.reference} (v${q.version}) | Ominet Digital` : `Your Ominet Digital Quotation ${q.reference}`,
    ...brandedEmail({
      siteUrl: SITE_URL,
      preheader: `Quotation ${q.reference} for ${projectOf(b)}`,
      heading: revised ? "Your revised quotation" : "Your quotation",
      paragraphs: [
        `Dear ${b.name},`,
        revised ? "Following our discussion, here is the updated quotation. It replaces the previous version." : "Thank you for your enquiry. Here is our proposed scope, fee and schedule for your project.",
        "To accept, or to discuss any part of it, simply reply to this email or message us on WhatsApp and quote the reference. Work does not begin until the terms are agreed and your booking is confirmed.",
      ],
      rows: quotationRows(q, b),
      button: { label: "Discuss on WhatsApp", href: `https://wa.me/2349026057899?text=${encodeURIComponent(`Hello Ominet Digital, regarding quotation ${q.reference}.`)}` },
    }),
  };
}

export function bookingConfirmedEmail(q: QuotationRow, b: BookingLite, bookingRef: string, paymentStatus: string) {
  return {
    subject: "Your Project Booking Is Confirmed | Ominet Digital",
    ...brandedEmail({
      siteUrl: SITE_URL,
      preheader: `Booking ${bookingRef} is confirmed`,
      heading: "Your booking is confirmed",
      paragraphs: [`Dear ${b.name},`, "Thank you. Your project booking is confirmed on the terms below. Please keep this email for your records."],
      rows: [["Booking reference", bookingRef], ["Payment status", paymentStatus], ...quotationRows(q, b).filter(([k]) => k !== "Valid until")],
      button: { label: "Contact us", href: "mailto:info@ominetdigital.com.ng" },
    }),
  };
}

export function stageEmail(b: BookingLite, note: { subject: string; heading: string; body: string }, ref: string) {
  return {
    subject: note.subject,
    ...brandedEmail({
      siteUrl: SITE_URL,
      preheader: note.heading,
      heading: note.heading,
      paragraphs: [`Dear ${b.name},`, note.body],
      rows: [["Booking reference", ref], ["Project", projectOf(b)], ["Service", b.service_title]],
      button: { label: "Chat on WhatsApp", href: "https://wa.me/2349026057899" },
    }),
  };
}
