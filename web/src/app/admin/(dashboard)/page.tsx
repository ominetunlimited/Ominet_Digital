import Link from "next/link";
import { css } from "@/lib/css";
import { supabaseConfigured } from "@/lib/supabase/env";
import { loadDashboardData } from "@/lib/admin/dashboard-data";
import { QUICK_ADD } from "@/lib/admin/nav";

export const metadata = { title: "Admin — Ominet Digital", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const DOT = { ok: "#1f9d55", warn: "#d98e04", off: "#8a8f98" } as const;

export default async function AdminOverviewPage() {
  const data = await loadDashboardData();

  const stats = [
    { label: "DRAFTS", value: data.counts.drafts, href: "/admin/content" },
    { label: "SCHEDULED", value: data.counts.scheduled, href: "/admin/content" },
    { label: "PUBLISHED", value: data.counts.published, href: "/admin/content" },
    { label: "COMMENTS AWAITING", value: data.counts.pendingComments, href: "/admin/comments", warn: data.counts.pendingComments > 0 },
    { label: "BOOKINGS AWAITING", value: data.counts.pendingBookings, href: "/admin/bookings", warn: data.counts.pendingBookings > 0 },
    { label: "SUBSCRIBERS", value: data.counts.subscribers, href: "/admin/newsletter" },
  ];

  return (
    <div style={css("position:relative;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-4);")}>Overview</h1>

      {!supabaseConfigured && (
        <p style={css("font-size:13px;opacity:0.7;margin-bottom:var(--space-6);")}>
          Supabase isn&apos;t configured yet, so these are all zero. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY, run the migrations in supabase/migrations, and reload.
        </p>
      )}

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>QUICK ACTIONS</div>
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-6);")}>
        {QUICK_ADD.map((a) => (
          <Link key={a.href} href={a.href} className="btn btn-secondary" style={css("font-size:13px;")}>
            + {a.label}
          </Link>
        ))}
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-4);margin-bottom:var(--space-8);")}>
        {stats.map((s) => (
          <Link href={s.href} key={s.label} className="card" style={css(`text-decoration:none;color:inherit;${s.warn ? "border:1px solid var(--om-coral);" : ""}`)}>
            <div className="card-kicker" style={s.warn ? css("color:var(--om-coral);") : undefined}>{s.label}</div>
            <div style={css("font-family:var(--font-heading);font-size:32px;")}>{s.value}</div>
          </Link>
        ))}
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--space-8);align-items:start;")}>
        <div>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RECENT CONTENT</div>
          {data.recentContent.length === 0 ? (
            <p style={css("font-size:13px;opacity:0.6;")}>Nothing published yet. <Link href="/admin/content/new">Create your first item &rarr;</Link></p>
          ) : (
            <table className="table table-responsive" style={css("width:100%;")}>
              <thead><tr><th>Title</th><th>Type</th><th>Access</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentContent.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Title"><Link href={`/admin/content/${r.id}`}>{r.title}</Link></td>
                    <td data-label="Type">{r.type}</td>
                    <td data-label="Access"><span className={r.access === "paid" ? "tag tag-accent" : "tag tag-outline"}>{r.access}</span></td>
                    <td data-label="Status">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={css("display:grid;gap:var(--space-6);")}>
          <div>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RECENT ACTIVITY</div>
            {data.recentActivity.length === 0 ? (
              <p style={css("font-size:13px;opacity:0.6;")}>Nothing logged yet.</p>
            ) : (
              <div style={css("display:grid;gap:var(--space-2);")}>
                {data.recentActivity.map((a, i) => (
                  <div key={i} className="card" style={css("gap:2px;padding:var(--space-2) var(--space-3);")}>
                    <div style={css("font-size:13px;overflow-wrap:anywhere;")}><strong>{a.who}</strong> {a.what}</div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/audit-log" style={css("font-size:12px;display:inline-block;margin-top:var(--space-2);")}>View full audit log &rarr;</Link>
          </div>

          <div>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SITE HEALTH</div>
            <Link href="/admin/settings" className="card" style={css("text-decoration:none;color:inherit;gap:var(--space-2);")}>
              <div style={css("display:flex;align-items:center;gap:var(--space-2);")}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: DOT[data.integrations.worst], flexShrink: 0 }} />
                <span style={css("font-size:13px;")}>
                  {data.integrations.ok} connected
                  {data.integrations.warn > 0 ? `, ${data.integrations.warn} need attention` : ""}
                  {data.integrations.off > 0 ? `, ${data.integrations.off} not set up` : ""}
                </span>
              </div>
              <div style={css("font-size:12px;opacity:0.6;")}>Manage connected services &rarr;</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
