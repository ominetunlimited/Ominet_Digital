import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { DOC_LABEL, type DocKind } from "@/lib/documents";

export const metadata = { title: "Documents — Admin", robots: { index: false, follow: false } };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = (await supabase?.from("documents").select("id,number,kind,status,title,created_at,issued_at,bookings(name,service_title)").order("created_at", { ascending: false }).limit(300)) ?? { data: [] };
  const rows = (data ?? []) as unknown as { id: string; number: string; kind: DocKind; status: string; title: string; created_at: string; issued_at: string | null; bookings: { name: string; service_title: string } | null }[];
  return (
    <div>
      <h1 style={css("margin:0 0 var(--space-2);")}>Documents</h1>
      <p style={css("opacity:0.7;max-width:62ch;")}>Quotations, booking confirmations, agreements, invoices, receipts and completion notes. Create them from a booking&rsquo;s Details panel under Bookings. Receipts are created when a payment is recorded.</p>
      {rows.length === 0 ? <p>No documents yet.</p> : (
        <div style={css("overflow-x:auto;")}>
          <table style={css("width:100%;border-collapse:collapse;font-size:13px;")}>
            <thead><tr style={css("text-align:left;")}><th>Number</th><th>Type</th><th>Client</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={css("border-top:1px solid var(--color-divider);")}>
                  <td style={css("padding:8px 6px;")}><Link href={`/admin/documents/${r.id}`}>{r.number}</Link></td>
                  <td>{DOC_LABEL[r.kind] ?? r.kind}</td>
                  <td>{r.bookings?.name ?? ""}{r.bookings?.service_title ? ` · ${r.bookings.service_title}` : ""}</td>
                  <td style={css("text-transform:uppercase;font-size:11px;letter-spacing:0.06em;")}>{r.status}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
