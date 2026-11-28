import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import RowActions from "@/components/admin/RowActions";
import { getViewCounts } from "@/lib/admin/view-counts";

export const metadata = { title: "Books — Admin", robots: { index: false, follow: false } };

export default async function AdminBooksListPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("books").select("id,slug,title,kind,year,status,featured").order("created_at", { ascending: false })
    : { data: [] };
  const items = data ?? [];
  const views = supabase ? await getViewCounts(supabase, items.map((r) => (r.slug ? `/books/${r.slug}` : ""))) : {};

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Books</h1>
        <Link href="/admin/books/new"><button type="button" className="btn btn-primary">New book</button></Link>
      </div>

      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No books yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Kind</th><th>Year</th><th>Status</th><th>Featured</th><th><span style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>Actions</span></th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td data-label="Title"><Link href={`/admin/books/${r.id}`}>{r.title}</Link></td>
                <td data-label="Kind">{r.kind}</td>
                <td data-label="Year">{r.year}</td>
                <td data-label="Status">{r.status}</td>
                <td data-label="Featured">{r.featured ? "★" : ""}</td>
                <td data-label="Actions"><RowActions kind="books" id={r.id} title={r.title} previewHref={r.slug ? `/books/${r.slug}` : null} published={r.status === "published"} views={views[`/books/${r.slug}`] ?? 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
