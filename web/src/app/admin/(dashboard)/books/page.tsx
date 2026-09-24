import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Books — Admin", robots: { index: false, follow: false } };

export default async function AdminBooksListPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("books").select("id,title,kind,year,status,featured").order("created_at", { ascending: false })
    : { data: [] };
  const items = data ?? [];

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-3);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Books</h1>
        <Link href="/admin/books/new"><button type="button" className="btn btn-primary">New book</button></Link>
      </div>

      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No books yet.</p>
      ) : (
        <table className="table" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Kind</th><th>Year</th><th>Status</th><th>Featured</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/books/${r.id}`}>{r.title}</Link></td>
                <td>{r.kind}</td>
                <td>{r.year}</td>
                <td>{r.status}</td>
                <td>{r.featured ? "★" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
