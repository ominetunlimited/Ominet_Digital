"use server";

import { sanitizeRichHtml } from "@/lib/rich-text";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
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
  in_blog: boolean;
  blog_featured: boolean;
  category_id: string;
  featured_image_alt: string;
  social_image_url: string;
  social_image_alt: string;
  author_name: string;
  author_bio: string;
  tags: string;
  /** Blog posts: main categories, their subcategories, and which main category is primary. */
  category_ids?: string[];
  subcategory_ids?: string[];
  primary_category_id?: string;
  abstract?: string;
  references_html?: string;
  show_toc?: boolean;
  image_credit?: string;
  contributors?: string;
  editorial_label?: string;
  disclosure?: string;
  correction_note?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LABELS = new Set(["news", "analysis", "opinion", "review", "sponsored", "fiction", "explainer"]);

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveContent(input: ContentInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

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
    body: sanitizeRichHtml(input.body) || null,
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
    in_blog: !!input.in_blog,
    blog_featured: !!input.in_blog && !!input.blog_featured,
    category_id: /^[0-9a-f-]{36}$/i.test(input.category_id ?? "") ? input.category_id : null,
    featured_image_alt: input.featured_image_alt || null,
    social_image_url: input.social_image_url || null,
    social_image_alt: input.social_image_alt || null,
    author_name: input.author_name || null,
    author_bio: input.author_bio || null,
    abstract: input.abstract?.trim() || null,
    references_html: input.references_html ? sanitizeRichHtml(input.references_html) || null : null,
    show_toc: input.show_toc ?? true,
    image_credit: input.image_credit?.trim() || null,
    contributors: input.contributors?.trim() || null,
    editorial_label: input.editorial_label && LABELS.has(input.editorial_label) ? input.editorial_label : null,
    disclosure: input.disclosure?.trim() || null,
    correction_note: input.correction_note?.trim() || null,
  };

  // Blog taxonomy: validated before anything is written, so a bad combination never half-saves.
  let taxonomy: { ids: string[]; primary: string | null } | null = null;
  if (input.in_blog) {
    const main = Array.from(new Set((input.category_ids ?? []).filter((x) => UUID.test(x))));
    const subs = Array.from(new Set((input.subcategory_ids ?? []).filter((x) => UUID.test(x))));
    if (input.status === "published" && main.length === 0) return { ok: false, error: "Choose at least one category before publishing a blog post." };
    if (main.length) {
      const primary = input.primary_category_id && UUID.test(input.primary_category_id) ? input.primary_category_id : main[0];
      if (!main.includes(primary)) return { ok: false, error: "The primary category must be one of the categories you selected." };
      const { data: found } = await supabase.from("categories").select("id,parent_id,name").in("id", [...main, ...subs]);
      const byId = new Map((found ?? []).map((c) => [c.id as string, c]));
      for (const id of main) {
        const c = byId.get(id);
        if (!c) return { ok: false, error: "One of the selected categories no longer exists." };
        if (c.parent_id) return { ok: false, error: `"${c.name}" is a subcategory. Choose its main category, then tick the subcategory.` };
      }
      for (const id of subs) {
        const c = byId.get(id);
        if (!c) return { ok: false, error: "One of the selected subcategories no longer exists." };
        if (!c.parent_id || !main.includes(c.parent_id as string)) return { ok: false, error: `"${c.name}" does not belong to any of the main categories you selected.` };
      }
      taxonomy = { ids: [...main, ...subs], primary };
    } else taxonomy = { ids: [], primary: null };
  }
  if (input.status === "scheduled") {
    const when = input.published_at ? new Date(input.published_at) : null;
    if (!when || Number.isNaN(when.getTime())) return { ok: false, error: "Choose the date and time this article should be published." };
    if (when.getTime() <= Date.now()) return { ok: false, error: "A scheduled time must be in the future. Use Publish to go live now." };
    row.published_at = when.toISOString();
  }

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
    for (const k of ["abstract", "references_html", "show_toc", "image_credit", "contributors", "editorial_label", "disclosure", "correction_note", "in_blog", "blog_featured", "category_id", "featured_image_alt", "social_image_url", "social_image_alt", "author_name", "author_bio"]) delete row[k];
    ({ data, error } = input.id
      ? await supabase.from("content").update(row).eq("id", input.id).select("id,slug").single()
      : await supabase.from("content").insert(row).select("id,slug").single());
  }

  if (error || !data) return { ok: false, error: error?.message ?? "Save failed unexpectedly." };

  if (taxonomy) {
    const { error: catErr } = await supabase.rpc("set_content_categories", { p_content: data.id, p_categories: taxonomy.ids, p_primary: taxonomy.primary });
    if (catErr) return { ok: false, error: `Saved, but the categories were not applied: ${catErr.message}`, };
  } else if (!input.in_blog && input.id) {
    // Moved out of the blog: categories belong to blog posts only.
    await supabase.rpc("set_content_categories", { p_content: data.id, p_categories: [], p_primary: null });
  }

  // Tags: comma-separated names. Found by slug or created, then the post's set is replaced.
  const names = Array.from(new Set((input.tags ?? "").split(",").map((t) => t.trim().slice(0, 40)).filter(Boolean))).slice(0, 12);
  const tagRows = names.map((name) => ({ name, slug: slugify(name) })).filter((t) => t.slug);
  await supabase.from("content_tags").delete().eq("content_id", data.id);
  if (tagRows.length) {
    await supabase.from("tags").upsert(tagRows, { onConflict: "slug", ignoreDuplicates: true });
    const { data: found } = await supabase.from("tags").select("id").in("slug", tagRows.map((t) => t.slug));
    if (found?.length) await supabase.from("content_tags").insert(found.map((t) => ({ content_id: data.id, tag_id: t.id })));
  }

  revalidatePath("/admin/content");
  revalidatePath("/articles");
  revalidatePath("/blog");
  revalidatePath("/blog/category/[slug]", "page");
  revalidatePath(`/blog/${data.slug}`);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/blog/${previousSlug}`);
  revalidatePath(`/articles/${data.slug}`);
  if (previousSlug && previousSlug !== data.slug) revalidatePath(`/articles/${previousSlug}`);
  revalidatePath("/");
  return { ok: true, id: data.id as string };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/content");
  revalidatePath("/articles");
  revalidatePath("/blog");
  redirect("/admin/content");
}
