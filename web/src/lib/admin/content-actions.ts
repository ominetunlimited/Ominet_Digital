"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ContentInput = {
  id?: string;
  title: string;
  slug: string;
  type: string;
  subcategory: string;
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
  featured_image_url: string;
  video_url: string;
  video_thumbnail_url: string;
  featured: boolean;
  external_url: string;
  external_label: string;
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveContent(input: ContentInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug can't be empty once normalized — add some letters or numbers." };

  // Fetch the slug this row currently has (before we overwrite it) so we
  // can revalidate that old public URL too — otherwise it keeps serving a
  // stale cached page (or a stale draft) after a rename.
  let previousSlug: string | null = null;
  if (input.id) {
    const { data: existing } = await supabase.from("content").select("slug").eq("id", input.id).maybeSingle();
    previousSlug = existing?.slug ?? null;
  }

  const row: Record<string, unknown> = {
    title: input.title,
    slug,
    type: input.type,
    subcategory: input.subcategory || null,
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
    featured_image_url: input.featured_image_url || null,
    video_url: input.video_url || null,
    video_thumbnail_url: input.video_thumbnail_url || null,
    featured: input.featured ?? false,
    external_url: input.external_url || null,
    external_label: input.external_label || null,
  };

  let { data, error } = input.id
    ? await supabase.from("content").update(row).eq("id", input.id).select("id,slug").single()
    : await supabase.from("content").insert(row).select("id,slug").single();

  // PGRST204 = PostgREST couldn't find that column in its schema cache
  // (its own pre-flight check on a write payload, distinct from 42703 —
  // the raw Postgres "undefined column" error a select() gets). Either way
  // it means video_url/video_thumbnail_url (0003_video_fields.sql) or
  // featured/external_url/external_label (0022_content_extras.sql) may not
  // be applied to this project yet. Retry without them so the rest of the
  // save still goes through; those fields just won't persist until the
  // relevant migration runs.
  if (error?.code === "42703" || error?.code === "PGRST204") {
    delete row.video_url;
    delete row.video_thumbnail_url;
    delete row.featured;
    delete row.external_url;
    delete row.external_label;
    delete row.subcategory;
    ({ data, error } = input.id
      ? await supabase.from("content").update(row).eq("id", input.id).select("id,slug").single()
      : await supabase.from("content").insert(row).select("id,slug").single());
  }

  if (error || !data) return { ok: false, error: error?.message ?? "Save failed unexpectedly." };

  revalidatePath("/admin/content");
  revalidatePath("/writing");
  revalidatePath(`/writing/${data.slug}`);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/writing/${previousSlug}`);
  revalidatePath("/");
  return { ok: true, id: data.id as string };
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
