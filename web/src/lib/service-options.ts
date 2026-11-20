import { formatMoney } from "@/lib/money";

export type ServiceOption = {
  id: string; serviceId: string; key: string; label: string; group: string | null; description: string | null; requirements: string | null;
  duration: string | null; priceMode: "fixed" | "from" | "range" | "quote"; priceCents: number | null; priceMaxCents: number | null;
  officialFeeCents: number | null; officialFeeNote: string | null; currency: string; active: boolean; order: number;
};

export type OptionRow = {
  id: string; service_id: string; key: string; label: string; group_label: string | null; description: string | null; requirements: string | null;
  duration: string | null; price_mode: string; price_cents: number | null; price_max_cents: number | null; official_fee_cents: number | null;
  official_fee_note: string | null; currency: string; active: boolean; display_order: number;
};

export const OPTION_COLS = "id,service_id,key,label,group_label,description,requirements,duration,price_mode,price_cents,price_max_cents,official_fee_cents,official_fee_note,currency,active,display_order";

export function mapOption(r: OptionRow): ServiceOption {
  const mode = (["fixed", "from", "range", "quote"].includes(r.price_mode) ? r.price_mode : "quote") as ServiceOption["priceMode"];
  return {
    id: r.id, serviceId: r.service_id, key: r.key, label: r.label, group: r.group_label, description: r.description, requirements: r.requirements,
    duration: r.duration, priceMode: mode, priceCents: r.price_cents == null ? null : Number(r.price_cents), priceMaxCents: r.price_max_cents == null ? null : Number(r.price_max_cents),
    officialFeeCents: r.official_fee_cents == null ? null : Number(r.official_fee_cents), officialFeeNote: r.official_fee_note, currency: r.currency, active: r.active, order: r.display_order,
  };
}

/** Professional-fee wording only. Official charges are shown on their own and never added in silently. */
export function optionPriceLabel(o: Pick<ServiceOption, "priceMode" | "priceCents" | "priceMaxCents" | "currency">): string {
  if (o.priceMode === "quote" || o.priceCents == null) return "Quote on request";
  const a = formatMoney(o.priceCents, o.currency);
  if (o.priceMode === "from") return `From ${a}`;
  if (o.priceMode === "range") return o.priceMaxCents != null ? `${a} to ${formatMoney(o.priceMaxCents, o.currency)}` : `From ${a}`;
  return a;
}

export type Flavour = "nysc" | "cac";
/** Which request form a service uses. Matched on the slug so renaming the title cannot break it. */
export function flavourOf(slug: string): Flavour | null {
  if (slug.startsWith("nysc-")) return "nysc";
  if (slug.startsWith("cac-")) return "cac";
  return null;
}
