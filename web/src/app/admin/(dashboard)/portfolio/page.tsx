import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { LABELS } from "@/lib/portfolio-labels";

export const metadata = { title: "Work — Admin", robots: { index: false, follow: false } };

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("portfolio_items").select("id,title,label,status,featured,display_order,updated_at").order("display_order").order("updated_at", { ascending: false }) : { data: [] };
  const items = data ?? [];
  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Work (portfolio)</h1>
        <Link href="/admin/portfolio/new" className="btn btn-primary">New project</Link>
      </div>
      <p style={css("font-size:14px;opacity:0.65;max-width:640px;margin-bottom:var(--space-5);")}>Add slides, videos, photos and PDFs for each project. The Work page and menu link appear on the site only once at least one project is published. Each project carries an honest label (personal, simulated, volunteer or client).</p>
      {items.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No projects yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Kind</th><th>Status</th><th>Featured</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td><td>{LABELS[p.label]?.name ?? p.label}</td><td>{p.status}</td><td>{p.featured ? "Yes" : ""}</td>
                <td><Link href={`/admin/portfolio/${p.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
