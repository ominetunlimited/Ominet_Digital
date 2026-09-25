"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ProductInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  price_cents: number | null;
  currency: string;
  access: string; // free | paid | external | affiliate | gated
  external_url: string;
  external_label: string;
  affiliate_disclosure: string;
  status: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug can't be empty once normalized — add some letters or numbers." };

  let previousSlug: string | null = null;
  if (input.id) {
    const { data: existing } = await supabase.from("products").select("slug").eq("id", input.id).maybeSingle();
    previousSlug = existing?.slug ?? null;
  }

  const row = {
    title: input.title,
    slug,
    description: input.description || null,
    image_url: input.image_url || null,
    price_cents: input.access === "paid" || input.access === "gated" ? input.price_cents : null,
    currency: input.currency || "NGN",
    access: input.access,
    external_url: input.access === "external" || input.access === "affiliate" ? input.external_url || null : null,
    external_label: input.external_label || null,
    affiliate_disclosure: input.access === "affiliate" ? input.affiliate_disclosure || null : null,
    status: input.status,
  };

  const { data, error } = input.id
    ? await supabase.from("products").update(row).eq("id", input.id).select("id,slug").single()
    : await supabase.from("products").insert(row).select("id,slug").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Save failed unexpectedly." };

  revalidatePath("/admin/store");
  revalidatePath("/store");
  if (previousSlug && previousSlug !== data.slug) revalidatePath("/store");
  redirect(`/admin/store/${data.id}`);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/store");
  revalidatePath("/store");
  redirect("/admin/store");
}
