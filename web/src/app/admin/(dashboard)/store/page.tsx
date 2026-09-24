import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Store — Admin", robots: { index: false, follow: false } };

export default async function AdminStorePage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("products").select("id,title,access,price_cents,currency,status").order("created_at", { ascending: false })
    : { data: [] };
  const products = data ?? [];

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Store</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        The <code>products</code> table is live, but the public Store page still renders its placeholder mock
        items — wiring it to this table (plus a create/edit form here) is the next pass on the Store.
      </p>
      {products.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No products yet.</p>
      ) : (
        <table className="table" style={css("width:100%;")}>
          <thead><tr><th>Title</th><th>Access</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.access}</td>
                <td>{p.price_cents != null ? `${p.currency} ${(p.price_cents / 100).toFixed(2)}` : "—"}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
