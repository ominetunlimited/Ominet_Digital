"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { slugify } from "@/lib/slug";

export type OptionInput = {
  id?: string; serviceId: string; key?: string; label: string; group: string; description: string; requirements: string; duration: string;
  priceMode: string; price: string; priceMax: string; officialFee: string; officialFeeNote: string; currency: string; active: boolean; order: number;
};
export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
function cents(v: string): number | null | "bad" {
  const t = String(v ?? "").replace(/[,\s₦$]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : "bad";
}

export async function saveServiceOption(input: OptionInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const label = clip(input.label, 200);
  if (!label) return { ok: false, error: "Give the option a name." };
  const mode = ["fixed", "from", "range", "quote"].includes(input.priceMode) ? input.priceMode : "quote";
  const price = cents(input.price), max = cents(input.priceMax), official = cents(input.officialFee);
  if (price === "bad" || max === "bad" || official === "bad") return { ok: false, error: "Amounts must be plain numbers such as 25000." };
  if (mode !== "quote" && price === null) return { ok: false, error: "Enter a price, or choose “Quote on request”. Prices are never filled in for you." };
  if (mode === "range" && (max === null || (price !== null && max < price))) return { ok: false, error: "A price range needs a maximum that is not below the minimum." };
  const currency = clip(input.currency, 3).toUpperCase() || "NGN";
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Currency must be a 3-letter code such as NGN." };

  const row = {
    label, group_label: clip(input.group, 120) || null, description: clip(input.description, 600) || null, requirements: clip(input.requirements, 2000) || null,
    duration: clip(input.duration, 120) || null, price_mode: mode, price_cents: mode === "quote" ? null : price, price_max_cents: mode === "range" ? max : null,
    official_fee_cents: official, official_fee_note: clip(input.officialFeeNote, 300) || null, currency, active: !!input.active,
    display_order: Number.isFinite(input.order) ? Math.trunc(input.order) : 0, updated_at: new Date().toISOString(),
  };
  const db = auth.supabase;
  const { data: svc } = await db.from("services").select("slug").eq("id", input.serviceId).maybeSingle();
  if (!svc) return { ok: false, error: "That service no longer exists." };
  if (input.id) {
    const { error } = await db.from("service_options").update(row).eq("id", input.id).eq("service_id", input.serviceId);
    if (error) return { ok: false, error: error.message };
  } else {
    const key = slugify(input.key || label).slice(0, 40);
    if (!key) return { ok: false, error: "The name needs some letters or numbers." };
    const { error } = await db.from("service_options").insert({ ...row, service_id: input.serviceId, key });
    if (error) return { ok: false, error: error.code === "23505" ? "An option with that name already exists." : error.message };
  }
  revalidatePath(`/services/${svc.slug}`); revalidatePath(`/services/${svc.slug}/request`); revalidatePath("/services");
  return { ok: true, message: "Saved." };
}

export async function deleteServiceOption(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { data: o } = await auth.supabase.from("service_options").select("service_id").eq("id", id).maybeSingle();
  const { error } = await auth.supabase.from("service_options").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (o) revalidatePath("/services");
  return { ok: true };
}
