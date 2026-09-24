import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import AdPlacementRow from "@/components/admin/AdPlacementRow";

export const metadata = { title: "Advertising — Admin", robots: { index: false, follow: false } };

export default async function AdminAdvertisingPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("ad_placements").select("*").order("slot_key")
    : { data: [] };

  return (
    <div style={css("max-width:640px;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Advertising</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);")}>
        Ads only render where a placement is Active. Sponsored/direct placements are always labelled &quot;Sponsored&quot; on the public site.
      </p>
      {(data ?? []).map((p) => (
        <AdPlacementRow key={p.id} placement={p} />
      ))}
    </div>
  );
}
