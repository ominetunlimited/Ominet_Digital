import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Content — Admin", robots: { index: false, follow: false } };

export default async function AdminContentListPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("content").select("id,title,type,access,status,published_at").order("created_at", { ascending: false })
    : { data: [] };
  const items = data ?? [];

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Content</h1>
        <Link href="/admin/content/new"><button type="button" className="btn btn-primary">New item</button></Link>
      </div>

      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>Nothing here yet.</p>
      ) : (
        <table className="table" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Type</th><th>Access</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((r) => (
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
