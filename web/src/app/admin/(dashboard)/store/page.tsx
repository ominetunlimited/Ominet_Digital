import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Store — Admin", robots: { index: false, follow: false } };

export default async function AdminStorePage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("products").select("id,title,access,price_cents,currency,status").order("created_at", { ascending: false })
    : { data: [] };
  const products = data ?? [];

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Store</h1>
        <Link href="/admin/store/new" className="btn btn-primary">New product</Link>
      </div>
      {products.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No products yet.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Access</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td data-label="Title"><Link href={`/admin/store/${p.id}`}>{p.title}</Link></td>
                <td data-label="Access">{p.access}</td>
                <td data-label="Price">{formatMoney(p.price_cents, p.currency)}</td>
                <td data-label="Status">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
