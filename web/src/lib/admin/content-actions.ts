"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ContentInput = {
  id?: string;
  title: string;
  slug: string;
  type: string;
  dek: string;
  excerpt: string;
  body: string;
  access: string;
  price_cents: number | null;
  currency: string;
  status: string;
  published_at: string | null;
  read_minutes: number | null;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveContent(input: ContentInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const row = {
    title: input.title,
    slug: input.slug,
    type: input.type,
    dek: input.dek || null,
    excerpt: input.excerpt || null,
    body: input.body || null,
    access: input.access,
    price_cents: input.access === "paid" ? input.price_cents : null,
    currency: input.currency || "NGN",
    status: input.status,
    published_at: input.status === "published" ? input.published_at || new Date().toISOString() : input.published_at,
    read_minutes: input.read_minutes,
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    og_image_url: input.og_image_url || null,
  };

  const { data, error } = input.id
    ? await supabase.from("content").update(row).eq("id", input.id).select("id,slug").single()
    : await supabase.from("content").insert(row).select("id,slug").single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/content");
  revalidatePath("/writing");
  if (data?.slug) revalidatePath(`/writing/${data.slug}`);
  redirect(`/admin/content/${data.id}`);
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/content");
  revalidatePath("/writing");
  redirect("/admin/content");
}
