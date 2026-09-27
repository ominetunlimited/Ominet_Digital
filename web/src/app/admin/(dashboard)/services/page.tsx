import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ServiceListRow from "@/components/admin/ServiceListRow";

export const metadata = { title: "Services — Admin", robots: { index: false, follow: false } };

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("services").select("id,title,status,featured,display_order,price_cents,currency,pricing_mode").order("display_order", { ascending: true })
    : { data: [] };
  const services = data ?? [];

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0;")}>Services</h1>
        <Link href="/admin/services/new" className="btn btn-primary">New service</Link>
      </div>
      {services.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No services yet — services you add here appear on the public Services page automatically.</p>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead>
            <tr><th>Title</th><th>Price</th><th>Status</th><th>Featured</th><th>Order</th><th></th></tr>
          </thead>
          <tbody>
            {services.map((s) => <ServiceListRow key={s.id} item={s} />)}
          </tbody>
        </table>
      )}
    </div>
  );
}
