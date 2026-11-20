import { notFound } from "next/navigation";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import ServiceForm from "@/components/admin/ServiceForm";
import ServiceOptionsEditor, { type EditableOption } from "@/components/admin/ServiceOptionsEditor";
import { flavourOf } from "@/lib/service-options";

export const metadata = { title: "Edit service — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("services").select("*").eq("id", id).maybeSingle() : { data: null };
  if (!data) notFound();
  const { data: optRows } = supabase ? await supabase.from("service_options").select("*").eq("service_id", id).order("display_order") : { data: [] };
  const opts: EditableOption[] = (optRows ?? []).map((r) => ({
    id: r.id, key: r.key, label: r.label, group: r.group_label, description: r.description, requirements: r.requirements, duration: r.duration, priceMode: r.price_mode,
    priceCents: r.price_cents == null ? null : Number(r.price_cents), priceMaxCents: r.price_max_cents == null ? null : Number(r.price_max_cents),
    officialFeeCents: r.official_fee_cents == null ? null : Number(r.official_fee_cents), officialFeeNote: r.official_fee_note, currency: r.currency, active: r.active, order: r.display_order,
  }));
  const showOptions = opts.length > 0 || flavourOf(data.slug) !== null;

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Edit service</h1>
      <ServiceForm initial={data} />
      {showOptions && <ServiceOptionsEditor serviceId={id} options={opts} />}
    </div>
  );
}
