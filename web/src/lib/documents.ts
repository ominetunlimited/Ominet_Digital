import { esc } from "@/lib/email-template";
import type { Milestone } from "@/lib/workflow";

export const DOC_KINDS = ["quotation", "booking_confirmation", "agreement", "invoice", "receipt", "completion_note"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const DOC_LABEL: Record<DocKind, string> = {
  quotation: "Quotation",
  booking_confirmation: "Booking confirmation",
  agreement: "Project agreement",
  invoice: "Invoice",
  receipt: "Payment receipt",
  completion_note: "Completion note",
};

export type DocQuote = {
  id: string; reference: string; version: number; scope: string | null; price_cents: number; discount_cents: number; currency: string;
  duration: string | null; start_date: string | null; completion_date: string | null; location: string | null; event_date: string | null;
  deliverables: string | null; milestones: Milestone[]; payment_terms: string | null; revision_terms: string | null; conditions: string | null; expiry_date: string | null;
  line_items?: { kind: string; label: string; amount_cents: number }[] | null;
};
export type DocBooking = { id: string; name: string; email: string; phone: string | null; service_title: string; reference: string | null; booking_ref: string | null; details: Record<string, unknown> | null };
export type DocPayment = { id: string; kind: string; amount_cents: number; currency: string; method: string | null; reference: string | null; paid_on: string; note: string | null; status: string; created_at: string };

/** Everything a PDF needs, frozen at the moment the document is created or refreshed. */
export type DocData = {
  client: { name: string; email: string; phone?: string };
  project: string;
  service: string;
  refs: [label: string, value: string][];
  rows: [label: string, value: string][];
  milestones: { title: string; due?: string; amount?: string }[];
  payments: { date: string; description: string; method: string; amount: string }[];
  totals: [label: string, value: string, strong?: boolean][];
  signatures: boolean;
  currency: string;
};

/** Marker left in drafts wherever the team still has to add real details. Issuing is blocked while one remains. */
export const PLACEHOLDER_RE = /\[\[[^\]]+\]\]/;

const NAIRA_SAFE = (cur: string) => (cur || "NGN").toUpperCase();
/** The built-in PDF fonts cannot draw the naira sign, so documents use the currency code instead. */
export function docMoney(cents: number, currency: string): string {
  return `${NAIRA_SAFE(currency)} ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export const docDate = (d: string | null | undefined) =>
  d ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

export const net = (q: Pick<DocQuote, "price_cents" | "discount_cents">) => Math.max(0, Number(q.price_cents) - Number(q.discount_cents));
export const paidTotal = (ps: DocPayment[]) => ps.filter((p) => p.status === "recorded").reduce((s, p) => s + Number(p.amount_cents), 0);

const KIND_LABEL: Record<string, string> = { deposit: "Deposit", instalment: "Instalment", balance: "Balance", full: "Full payment" };
const paraFromText = (t: string | null) => (t ? t.split(/\n{2,}/).map((x) => `<p>${esc(x.trim()).replace(/\n/g, "<br>")}</p>`).join("") : "");
const section = (heading: string, inner: string) => (inner ? `<h3>${esc(heading)}</h3>${inner}` : "");
const projectOf = (b: DocBooking) => (typeof b.details?.projectTitle === "string" && b.details.projectTitle ? (b.details.projectTitle as string) : b.service_title);

export type BuildCtx = { kind: DocKind; booking: DocBooking; quote: DocQuote | null; payments: DocPayment[]; payment?: DocPayment | null; today?: string };
export type Built = { title: string; intro_html: string; body_html: string; footer_html: string; data: DocData };

export function buildData(c: BuildCtx): DocData {
  const { booking: b, quote: q, payments } = c;
  const cur = q?.currency ?? c.payment?.currency ?? "NGN";
  const live = payments.filter((p) => p.status === "recorded");
  const refs: DocData["refs"] = [];
  if (b.booking_ref) refs.push(["Booking reference", b.booking_ref]);
  if (q) refs.push(["Quotation", `${q.reference}${q.version > 1 ? ` v${q.version}` : ""}`]);
  if (b.reference) refs.push(["Enquiry reference", b.reference]);

  const rows: DocData["rows"] = [];
  const totals: DocData["totals"] = [];
  if (q) {
    if (c.kind !== "receipt") {
      rows.push(["Service", b.service_title]);
      if (q.duration) rows.push(["Estimated duration", q.duration]);
      if (q.start_date) rows.push(["Proposed start", docDate(q.start_date)]);
      if (q.completion_date) rows.push(["Proposed completion", docDate(q.completion_date)]);
      if (q.location) rows.push(["Location", q.location]);
      if (q.event_date) rows.push(["Event date", docDate(q.event_date)]);
      if (c.kind === "quotation" && q.expiry_date) rows.push(["Valid until", docDate(q.expiry_date)]);
    }
    if (["quotation", "agreement", "invoice", "booking_confirmation"].includes(c.kind)) {
      const items = q.line_items ?? [];
      if (items.length) {
        const tag = (k: string) => (k === "official" ? "Official charge: " : k === "professional" ? "Professional fee: " : "Other: ");
        for (const li of items) totals.push([`${tag(li.kind)}${li.label}`, docMoney(Number(li.amount_cents), cur)]);
      } else totals.push(["Professional fee", docMoney(Number(q.price_cents), cur)]);
      if (Number(q.discount_cents) > 0) totals.push(["Discount", `- ${docMoney(Number(q.discount_cents), cur)}`]);
      totals.push(["Total", docMoney(net(q), cur), true]);
    }
    if (c.kind === "invoice" || c.kind === "completion_note") {
      const paid = paidTotal(live);
      totals.push(["Received to date", docMoney(paid, cur)]);
      totals.push(["Balance due", docMoney(Math.max(0, net(q) - paid), cur), true]);
    }
  }

  let payRows: DocData["payments"] = [];
  if (c.kind === "receipt" && c.payment) {
    const p = c.payment;
    const upTo = live.filter((x) => x.created_at <= p.created_at);
    rows.push(["Received from", b.name]);
    rows.push(["Date received", docDate(p.paid_on)]);
    rows.push(["Payment type", KIND_LABEL[p.kind] ?? p.kind]);
    if (p.method) rows.push(["Payment method", p.method]);
    if (p.reference) rows.push(["Payment reference", p.reference]);
    rows.push(["For", projectOf(b)]);
    totals.push(["Amount received", docMoney(Number(p.amount_cents), p.currency), true]);
    if (q) {
      totals.push(["Agreed total", docMoney(net(q), cur)]);
      totals.push(["Received to date", docMoney(paidTotal(upTo), cur)]);
      totals.push(["Balance remaining", docMoney(Math.max(0, net(q) - paidTotal(upTo)), cur), true]);
    }
  } else if (["invoice", "completion_note", "booking_confirmation"].includes(c.kind)) {
    payRows = live.map((p) => ({ date: docDate(p.paid_on), description: KIND_LABEL[p.kind] ?? p.kind, method: [p.method, p.reference].filter(Boolean).join(" · "), amount: docMoney(Number(p.amount_cents), p.currency) }));
  }

  return {
    client: { name: b.name, email: b.email, ...(b.phone ? { phone: b.phone } : {}) },
    project: projectOf(b), service: b.service_title, refs, rows,
    milestones: c.kind === "receipt" || c.kind === "completion_note" ? [] : (q?.milestones ?? []).filter((m) => m.title).map((m) => ({ title: m.title, due: m.due, amount: m.amount })),
    payments: payRows, totals, signatures: c.kind === "agreement", currency: cur,
  };
}

export function buildDocument(c: BuildCtx): Built {
  const { booking: b, quote: q } = c;
  const data = buildData(c);
  const hello = `Dear ${esc(b.name)},`;
  const common = { footer_html: "", data };

  switch (c.kind) {
    case "quotation":
      return { ...common, title: "Quotation",
        intro_html: `<p>${hello}</p><p>Thank you for your enquiry about ${esc(data.project)}. This quotation sets out the scope, deliverables, timing and fee we are proposing.</p>`,
        body_html: [section("Agreed scope", paraFromText(q?.scope ?? null)), section("Deliverables", paraFromText(q?.deliverables ?? null)), section("Payment schedule", paraFromText(q?.payment_terms ?? null)), section("Revisions", paraFromText(q?.revision_terms ?? null)), section("Conditions", paraFromText(q?.conditions ?? null))].join("") };
    case "booking_confirmation":
      return { ...common, title: "Booking confirmation",
        intro_html: `<p>${hello}</p><p>We are pleased to confirm your booking for ${esc(data.project)}, on the terms of the quotation you accepted.</p>`,
        body_html: [section("Scope", paraFromText(q?.scope ?? null)), section("Deliverables", paraFromText(q?.deliverables ?? null)), section("Payment schedule", paraFromText(q?.payment_terms ?? null)), section("Revisions", paraFromText(q?.revision_terms ?? null)), section("Conditions", paraFromText(q?.conditions ?? null))].join("") };
    case "agreement":
      return { ...common, title: "Project agreement",
        intro_html: `<p>This agreement is made between Ominet Digital (&ldquo;we&rdquo;) and ${esc(b.name)} (&ldquo;the client&rdquo;) for ${esc(data.project)}. It records the terms set out in quotation ${esc(q ? q.reference : "")} that the client accepted.</p>`,
        body_html: [section("Scope of work", paraFromText(q?.scope ?? null)), section("Deliverables", paraFromText(q?.deliverables ?? null)), section("Fees and payment", paraFromText(q?.payment_terms ?? null)), section("Revisions", paraFromText(q?.revision_terms ?? null)), section("Conditions", paraFromText(q?.conditions ?? null)), `<h3>Additional terms</h3><p>[[Add any additional terms here, or delete this section]]</p>`].join(""),
        footer_html: "<p>By signing below, both parties agree to these terms.</p>" };
    case "invoice":
      return { ...common, title: "Invoice",
        intro_html: `<p>${hello}</p><p>This invoice is for ${esc(data.project)}, under quotation ${esc(q ? q.reference : "")}.</p>`,
        body_html: [section("Payment schedule", paraFromText(q?.payment_terms ?? null)), `<h3>How to pay</h3><p>[[Add your bank or payment details here]]</p>`].join("") };
    case "receipt":
      return { ...common, title: "Payment receipt",
        intro_html: `<p>Received with thanks from ${esc(b.name)}. This receipt confirms the payment recorded below.</p>`,
        body_html: c.payment?.note ? `<p>${esc(c.payment.note)}</p>` : "" };
    case "completion_note":
      return { ...common, title: "Completion note",
        intro_html: `<p>${hello}</p><p>This note confirms that the work on ${esc(data.project)} has been completed.</p>`,
        body_html: [section("Delivered", paraFromText(q?.deliverables ?? null)), `<h3>Handover notes</h3><p>[[Add handover notes, or delete this section]]</p>`].join("") };
  }
}
