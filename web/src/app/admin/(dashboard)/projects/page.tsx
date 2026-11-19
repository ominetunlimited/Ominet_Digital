import Link from "next/link";
import { css } from "@/lib/css";
import { loadProjectRows, ACTIVE_STAGES, STAGE_LABEL } from "@/lib/admin/projects-data";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Projects — Admin", robots: { index: false, follow: false } };

const TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All confirmed" },
] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "active" } = await searchParams;
  const { rows } = await loadProjectRows();
  const confirmed = rows.filter((r) => [...ACTIVE_STAGES, "completed", "archived"].includes(r.stage));
  const shown = view === "completed" ? confirmed.filter((r) => r.stage === "completed" || r.stage === "archived") : view === "all" ? confirmed : confirmed.filter((r) => ACTIVE_STAGES.includes(r.stage));
  return (
    <div>
      <h1 style={css("margin:0 0 var(--space-2);")}>Projects</h1>
      <p style={css("opacity:0.7;max-width:62ch;")}>A booking becomes a project when it is confirmed. Money shown is only what has been recorded. Change a project&rsquo;s stage from its booking.</p>
      <nav aria-label="Project views" style={css("display:flex;gap:var(--space-2);margin:var(--space-3) 0;flex-wrap:wrap;")}>
        {TABS.map((t) => <Link key={t.key} href={`/admin/projects?view=${t.key}`} className={view === t.key ? "btn btn-primary" : "btn btn-secondary"} aria-current={view === t.key ? "page" : undefined}>{t.label}</Link>)}
      </nav>
      {shown.length === 0 ? <p>No projects here yet.</p> : (
        <div style={css("overflow-x:auto;")}>
          <table style={css("width:100%;border-collapse:collapse;font-size:13px;")}>
            <thead><tr style={css("text-align:left;")}><th>Project</th><th>Client</th><th>Stage</th><th>Agreed</th><th>Received</th><th>Outstanding</th><th>Dates</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} style={css("border-top:1px solid var(--color-divider);vertical-align:top;")}>
                  <td style={css("padding:8px 6px;")}><Link href={`/admin/bookings?status=all&q=${encodeURIComponent(r.email)}`}>{r.title}</Link><div style={css("font-size:11px;opacity:0.6;")}>{r.bookingRef ?? r.enquiryRef}</div></td>
                  <td><Link href={`/admin/clients/${encodeURIComponent(r.email)}`}>{r.client}</Link></td>
                  <td>{STAGE_LABEL[r.stage]}</td>
                  <td>{r.currency ? formatMoney(r.agreedCents, r.currency) : ""}</td>
                  <td>{r.currency ? formatMoney(r.paidCents, r.currency) : ""}</td>
                  <td>{r.currency ? formatMoney(Math.max(0, r.agreedCents - r.paidCents), r.currency) : ""}</td>
                  <td style={css("white-space:nowrap;")}>{[r.startDate, r.completionDate].filter(Boolean).join(" to ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
