import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Admin — Ominet Digital", robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  let counts = { drafts: 0, scheduled: 0, published: 0, subscribers: 0 };
  let recent: { id: string; title: string; type: string; access: string; status: string }[] = [];

  if (supabase) {
    const [draftsRes, scheduledRes, publishedRes, subsRes, recentRes] = await Promise.all([
      supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      supabase.from("content").select("id,title,type,access,status").order("created_at", { ascending: false }).limit(8),
    ]);
    counts = {
      drafts: draftsRes.count ?? 0,
      scheduled: scheduledRes.count ?? 0,
      published: publishedRes.count ?? 0,
      subscribers: subsRes.count ?? 0,
    };
    recent = recentRes.data ?? [];
  }

  const stats = [
    { label: "DRAFTS", value: counts.drafts },
    { label: "SCHEDULED", value: counts.scheduled },
    { label: "PUBLISHED", value: counts.published },
    { label: "SUBSCRIBERS", value: counts.subscribers },
  ];

  return (
    <div style={css("position:relative;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Overview</h1>
        <Link href="/admin/content/new"><button type="button" className="btn btn-primary">New article</button></Link>
      </div>

      {!supabaseConfigured && (
        <p style={css("font-size:13px;opacity:0.7;margin-bottom:var(--space-6);")}>
          Supabase isn&apos;t configured yet, so these are all zero. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY, run the migrations in supabase/migrations, and reload.
        </p>
      )}

      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-4);margin-bottom:var(--space-8);")}>
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <div className="card-kicker">{s.label}</div>
            <div style={css("font-family:var(--font-heading);font-size:32px;")}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RECENT CONTENT</div>
      {recent.length === 0 ? (
        <p style={css("font-size:13px;opacity:0.6;")}>Nothing published yet. <Link href="/admin/content/new">Create your first item &rarr;</Link></p>
      ) : (
        <table className="table" style={css("width:100%;margin-bottom:var(--space-8);")}>
          <thead><tr><th>Title</th><th>Type</th><th>Access</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/content/${r.id}`}>{r.title}</Link></td>
                <td>{r.type}</td>
                <td><span className={r.access === "paid" ? "tag tag-accent" : "tag tag-outline"}>{r.access}</span></td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
