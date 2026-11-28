import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import RowActions from "@/components/admin/RowActions";
import { getViewCounts } from "@/lib/admin/view-counts";

export const metadata = { title: "Content — Admin", robots: { index: false, follow: false } };

export default async function AdminContentListPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("content").select("id,slug,title,type,access,status,in_blog,published_at").order("created_at", { ascending: false })
    : { data: [] };
  const items = data ?? [];
  const pathOf = (r: (typeof items)[number]) => (r.slug ? `${r.in_blog ? "/blog" : "/articles"}/${r.slug}` : null);
  const views = supabase ? await getViewCounts(supabase, items.map((r) => pathOf(r) ?? "")) : {};

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Content</h1>
        <Link href="/admin/content/new"><button type="button" className="btn btn-primary">New item</button></Link>
      </div>

      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>Nothing here yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Type</th><th>Access</th><th>Status</th><th><span style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>Actions</span></th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td data-label="Title"><Link href={`/admin/content/${r.id}`}>{r.title}</Link></td>
                <td data-label="Type">{r.type}</td>
                <td data-label="Access"><span className={r.access === "paid" ? "tag tag-accent" : "tag tag-outline"}>{r.access}</span></td>
                <td data-label="Status">{r.status}</td>
                <td data-label="Actions"><RowActions kind="content" id={r.id} title={r.title} previewHref={pathOf(r)} published={r.status === "published"} views={views[pathOf(r) ?? ""] ?? 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
