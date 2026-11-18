import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import BookingRow, { type BookingItem } from "@/components/admin/BookingRow";
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

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = (params.status as BookingStatus | "all") || "pending";
  const q = safeTerm(params.q ?? "");

  const supabase = await createClient();
  let query = supabase
    ?.from("bookings")
    .select("id,service_title,name,email,phone,preferred_date,preferred_time,message,status,confirmed_date,confirmed_time,internal_notes,created_at,reference,enquiry_kind,details,email_status")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query?.eq("status", status);
  if (q) query = query?.or(`name.ilike.%${q}%,email.ilike.%${q}%,service_title.ilike.%${q}%`);

  const { data } = query ? await query : { data: [] };
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
        Requests from the Services pages. Customers need no account. Booking emails are not sent automatically yet — check here (or connect Telegram alerts in the next stage).
      </p>

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);")}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/bookings?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={t.key === status ? "btn btn-primary" : "btn btn-secondary"}
            style={css("font-size:12px;padding:6px 10px;")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form action="/admin/bookings" method="get" style={css("display:flex;gap:var(--space-2);margin-bottom:var(--space-4);max-width:400px;")}>
        <input type="hidden" name="status" value={status} />
        <input className="input" name="q" defaultValue={q} placeholder="Search name, email or service…" />
        <button type="submit" className="btn btn-secondary">Search</button>
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
