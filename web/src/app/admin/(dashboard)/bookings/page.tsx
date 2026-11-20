import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import BookingRow, { type BookingItem } from "@/components/admin/BookingRow";
import type { QuotationItem, EventItem, PaymentItem, DocItem } from "@/components/admin/WorkflowPanel";
import type { Stage } from "@/lib/workflow";
import type { BookingStatus } from "@/lib/admin/booking-actions";

export const metadata = { title: "Bookings — Admin", robots: { index: false, follow: false } };

const TABS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

/** Keep PostgREST's or()/ilike syntax safe from characters that would change the filter. */
function safeTerm(q: string) {
  return q.replace(/[,()%*\\]/g, " ").trim();
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; kind?: string; option?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const status = (params.status as BookingStatus | "all") || "pending";
  const q = safeTerm(params.q ?? "");
  const kind = ["project_enquiry", "nysc_request", "cac_request"].includes(params.kind ?? "") ? (params.kind as string) : "";
  const optionKey = /^[a-z0-9-]{1,40}$/.test(params.option ?? "") ? (params.option as string) : "";
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const from = DATE.test(params.from ?? "") ? (params.from as string) : "";
  const to = DATE.test(params.to ?? "") ? (params.to as string) : "";

  const supabase = await createClient();
  let query = supabase
    ?.from("bookings")
    .select("id,service_title,name,email,phone,preferred_date,preferred_time,message,status,confirmed_date,confirmed_time,internal_notes,created_at,reference,enquiry_kind,details,email_status,stage,booking_ref")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query?.eq("status", status);
  if (q) query = query?.or(`name.ilike.%${q}%,email.ilike.%${q}%,service_title.ilike.%${q}%,reference.ilike.%${q}%`);
  if (kind) query = query?.eq("enquiry_kind", kind);
  if (from) query = query?.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query?.lte("created_at", `${to}T23:59:59Z`);
  let optionList: { key: string; label: string; ids: string[] }[] = [];
  if (supabase) {
    const { data: opts } = await supabase.from("service_options").select("id,key,label");
    const by = new Map<string, { key: string; label: string; ids: string[] }>();
    for (const o of opts ?? []) { const e = by.get(o.key as string) ?? { key: o.key as string, label: o.label as string, ids: [] }; e.ids.push(o.id as string); by.set(o.key as string, e); }
    optionList = [...by.values()];
    const chosen = optionList.find((o) => o.key === optionKey);
    if (chosen) query = query?.overlaps("service_option_ids", chosen.ids);
  }
  const qs = (over: Record<string, string>) => {
    const m: Record<string, string> = { status, q, kind, option: optionKey, from, to, ...over };
    return "/admin/bookings?" + Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  };

  const { data } = query ? await query : { data: [] };
  const ids = (data ?? []).map((r) => r.id as string);
  const [qRes, eRes, pRes, dRes, fRes] = ids.length && supabase
    ? await Promise.all([
        supabase.from("quotations").select("*").in("booking_id", ids).order("version", { ascending: false }),
        supabase.from("enquiry_events").select("id,booking_id,kind,from_stage,to_stage,note,created_at").in("booking_id", ids).order("created_at", { ascending: false }).limit(500),
        supabase.from("booking_payments").select("id,booking_id,kind,amount_cents,currency,method,reference,paid_on,status").in("booking_id", ids).order("created_at", { ascending: true }),
        supabase.from("documents").select("id,booking_id,kind,number,status,payment_id").in("booking_id", ids).order("created_at", { ascending: false }),
        supabase.from("enquiry_uploads").select("id,booking_id,original_name,size_bytes").in("booking_id", ids).order("created_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const quotesBy = new Map<string, QuotationItem[]>();
  for (const q of qRes.data ?? []) {
    const list = quotesBy.get(q.booking_id) ?? [];
    list.push({
      id: q.id, reference: q.reference, version: q.version, status: q.status, scope: q.scope, priceCents: Number(q.price_cents), discountCents: Number(q.discount_cents),
      currency: q.currency, duration: q.duration, startDate: q.start_date, completionDate: q.completion_date, location: q.location, eventDate: q.event_date,
      deliverables: q.deliverables, milestones: (q.milestones ?? []) as QuotationItem["milestones"], paymentTerms: q.payment_terms, revisionTerms: q.revision_terms,
      conditions: q.conditions, expiryDate: q.expiry_date, sentAt: q.sent_at,
      lineItems: ((q.line_items ?? []) as { kind: string; label: string; amount_cents: number }[]).map((l) => ({ kind: l.kind, label: l.label, amountCents: Number(l.amount_cents) })),
    });
    quotesBy.set(q.booking_id, list);
  }
  const paysBy = new Map<string, PaymentItem[]>();
  for (const x of pRes.data ?? []) {
    const list = paysBy.get(x.booking_id) ?? [];
    list.push({ id: x.id, kind: x.kind, amountCents: Number(x.amount_cents), currency: x.currency, method: x.method, reference: x.reference, paidOn: x.paid_on, status: x.status });
    paysBy.set(x.booking_id, list);
  }
  const docsBy = new Map<string, DocItem[]>();
  for (const x of dRes.data ?? []) {
    const list = docsBy.get(x.booking_id) ?? [];
    list.push({ id: x.id, kind: x.kind, number: x.number, status: x.status, paymentId: x.payment_id });
    docsBy.set(x.booking_id, list);
  }
  const filesBy = new Map<string, { id: string; name: string; size: number }[]>();
  for (const x of fRes.data ?? []) filesBy.set(x.booking_id, [...(filesBy.get(x.booking_id) ?? []), { id: x.id, name: x.original_name, size: Number(x.size_bytes) }]);
  const eventsBy = new Map<string, EventItem[]>();
  for (const e of eRes.data ?? []) {
    const list = eventsBy.get(e.booking_id) ?? [];
    if (list.length < 12) list.push({ id: e.id, kind: e.kind, fromStage: e.from_stage, toStage: e.to_stage, note: e.note, createdAt: e.created_at });
    eventsBy.set(e.booking_id, list);
  }
  const items: BookingItem[] = (data ?? []).map((r) => ({
    id: r.id,
    serviceTitle: r.service_title,
    name: r.name,
    email: r.email,
    phone: r.phone,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    message: r.message,
    status: r.status,
    confirmedDate: r.confirmed_date,
    confirmedTime: r.confirmed_time,
    internalNotes: r.internal_notes,
    createdAt: r.created_at,
    reference: r.reference ?? null,
    enquiryKind: r.enquiry_kind ?? "service_request",
    details: (r.details ?? {}) as Record<string, unknown>,
    emailStatus: (r.email_status ?? {}) as Record<string, unknown>,
    stage: (r.stage ?? "new_enquiry") as Stage,
    bookingRef: r.booking_ref ?? null,
    quotations: quotesBy.get(r.id) ?? [],
    events: eventsBy.get(r.id) ?? [],
    payments: paysBy.get(r.id) ?? [],
    files: filesBy.get(r.id) ?? [],
    documents: docsBy.get(r.id) ?? [],
  }));

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-2);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Bookings</h1>
        <a href={`/admin/bookings/export?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="btn btn-secondary" style={css("font-size:12px;")}>
          Export CSV
        </a>
      </div>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);")}>
        Enquiries and requests from the Services and Discuss a Project pages. Open Details to prepare and send a quotation, record the client\u2019s answer and confirm the booking. Customers need no account.
      </p>

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);")}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs({ status: t.key })}
            className={t.key === status ? "btn btn-primary" : "btn btn-secondary"}
            style={css("font-size:12px;padding:6px 10px;")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-3);")} aria-label="Filter by service">
        {[["", "All services"], ["nysc_request", "NYSC"], ["cac_request", "CAC"], ["project_enquiry", "Project enquiries"]].map(([k, l]) => (
          <Link key={k || "all"} href={qs({ kind: k, option: "" })} className={k === kind ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:12px;padding:6px 10px;")}>{l}</Link>
        ))}
      </div>
      <form action="/admin/bookings" method="get" style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);align-items:flex-end;")}>
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="kind" value={kind} />
        <input className="input" style={css("max-width:260px;")} name="q" defaultValue={q} placeholder="Name, email, service or reference…" aria-label="Search" />
        <select className="input" style={css("max-width:260px;")} name="option" defaultValue={optionKey} aria-label="Sub-service">
          <option value="">Any sub-service</option>
          {optionList.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <label style={css("font-size:12px;")}>From<input className="input" type="date" name="from" defaultValue={from} /></label>
        <label style={css("font-size:12px;")}>To<input className="input" type="date" name="to" defaultValue={to} /></label>
        <button type="submit" className="btn btn-secondary">Filter</button>
      </form>

      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No bookings in this view.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead>
            <tr><th>Customer</th><th>Service</th><th>When</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((item) => <BookingRow key={item.id} item={item} />)}
          </tbody>
        </table>
      )}
    </div>
  );
}
