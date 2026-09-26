"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type FaqItem = { question: string; answer: string };

export type ServiceInput = {
  id?: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image_url: string;
  gallery: string[];
  category: string;
  price_cents: number | null;
  currency: string;
  pricing_mode: string; // fixed | hourly | package | quote
  duration: string;
  availability: string;
  location_mode: string; // remote | in_person | hybrid
  booking_enabled: boolean;
  requirements: string;
  faq: FaqItem[];
  external_booking_url: string;
  cta_label: string;
  status: string; // draft | published | archived
  featured: boolean;
  display_order: number;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveService(input: ServiceInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug can't be empty once normalized — add some letters or numbers." };

  let previousSlug: string | null = null;
  if (input.id) {
    const { data: existing } = await supabase.from("services").select("slug").eq("id", input.id).maybeSingle();
    previousSlug = existing?.slug ?? null;
  }

  const row = {
    title: input.title,
    slug,
    short_description: input.short_description || null,
    full_description: input.full_description || null,
    featured_image_url: input.featured_image_url || null,
    gallery: input.gallery,
    category: input.category || null,
    price_cents: input.pricing_mode === "quote" ? null : input.price_cents,
    currency: input.currency || "NGN",
    pricing_mode: input.pricing_mode,
    duration: input.duration || null,
    availability: input.availability || null,
    location_mode: input.location_mode,
    booking_enabled: input.booking_enabled,
    requirements: input.requirements || null,
    faq: input.faq,
    external_booking_url: input.external_booking_url || null,
    cta_label: input.cta_label || null,
    status: input.status,
    featured: input.featured,
    display_order: input.display_order,
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    og_image_url: input.og_image_url || null,
  };

  const { data, error } = input.id
    ? await supabase.from("services").update(row).eq("id", input.id).select("id,slug").single()
    : await supabase.from("services").insert(row).select("id,slug").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Save failed unexpectedly." };

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath(`/services/${data.slug}`);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/services/${previousSlug}`);
  return { ok: true, id: data.id as string };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect("/admin/services");
}

/** Quick status/feature toggles from the list view — no full form round-trip. */
export async function setServiceFields(id: string, patch: Partial<Pick<ServiceInput, "status" | "featured" | "display_order">>): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { data, error } = await supabase.from("services").update(patch).eq("id", id).select("slug").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  if (data?.slug) revalidatePath(`/services/${data.slug}`);
  return { ok: true };
}
