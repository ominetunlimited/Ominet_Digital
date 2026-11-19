import Link from "next/link";
import { css } from "@/lib/css";
import { loadProjectRows, totalsByCurrency, ACTIVE_STAGES } from "@/lib/admin/projects-data";

export const metadata = { title: "Clients — Admin", robots: { index: false, follow: false } };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { rows, phones } = await loadProjectRows();
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.email, [...(by.get(r.email) ?? []), r]);
  const term = q.trim().toLowerCase();
  const clients = [...by.entries()]
    .map(([email, list]) => ({ email, name: list[0].client, list }))
    .filter((c) => !term || c.email.includes(term) || c.name.toLowerCase().includes(term));
  return (
    <div>
      <h1 style={css("margin:0 0 var(--space-2);")}>Clients</h1>
      <p style={css("opacity:0.7;max-width:62ch;")}>People who have enquired or booked, grouped by email address. Nothing here is entered twice: it is read from their enquiries, quotations and recorded payments.</p>
      <form method="get" style={css("margin:var(--space-3) 0;max-width:360px;")}>
        <input className="input" name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search clients" />
      </form>
      {clients.length === 0 ? <p>No clients found.</p> : (
        <div style={css("overflow-x:auto;")}>
          <table style={css("width:100%;border-collapse:collapse;font-size:13px;")}>
            <thead><tr style={css("text-align:left;")}><th>Client</th><th>Enquiries</th><th>Active projects</th><th>Agreed</th><th>Received</th><th>Last enquiry</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.email} style={css("border-top:1px solid var(--color-divider);vertical-align:top;")}>
                  <td style={css("padding:8px 6px;")}><Link href={`/admin/clients/${encodeURIComponent(c.email)}`}>{c.name}</Link><div style={css("font-size:11px;opacity:0.6;")}>{c.email}{phones.get(c.email) ? ` · ${phones.get(c.email)}` : ""}</div></td>
                  <td>{c.list.length}</td>
                  <td>{c.list.filter((r) => ACTIVE_STAGES.includes(r.stage)).length}</td>
                  <td>{totalsByCurrency(c.list, (r) => r.agreedCents)}</td>
                  <td>{totalsByCurrency(c.list, (r) => r.paidCents)}</td>
                  <td>{new Date(c.list[0].createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
