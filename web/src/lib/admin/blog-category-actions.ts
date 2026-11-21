"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { slugify } from "@/lib/slug";

export type CategoryInput = {
  id?: string; name: string; slug: string; description: string; order: number; enabled: boolean;
  parentId?: string; seoTitle?: string; seoDescription?: string; imageUrl?: string; showWhenEmpty?: boolean;
};
export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refresh = () => { revalidatePath("/blog"); revalidatePath("/blog/category/[slug]", "page"); revalidatePath("/admin/blog-categories"); revalidatePath("/sitemap.xml"); };

export async function saveBlogCategory(input: CategoryInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const name = input.name.trim().slice(0, 60);
  const slug = slugify(input.slug || name);
  if (!name || !slug) return { ok: false, error: "A category needs a name." };
  const parentId = input.parentId && UUID.test(input.parentId) ? input.parentId : null;
  if (parentId && parentId === input.id) return { ok: false, error: "A category cannot be its own parent." };
  const row = {
    name, slug, description: input.description.trim().slice(0, 300) || null, display_order: Math.trunc(input.order) || 0, blog_enabled: !!input.enabled,
    parent_id: parentId, seo_title: input.seoTitle?.trim().slice(0, 70) || null, seo_description: input.seoDescription?.trim().slice(0, 170) || null,
    image_url: input.imageUrl?.trim() || null, show_when_empty: !!input.showWhenEmpty,
  };
  const { error } = input.id ? await auth.supabase.from("categories").update(row).eq("id", input.id) : await auth.supabase.from("categories").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? "A category with that name or URL slug already exists." : error.message };
  refresh();
  return { ok: true };
}

/** Deleting is allowed only for an unused category. Otherwise merge it into another one, which keeps every post correctly classified. */
export async function deleteBlogCategory(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const [{ count: kids }, { count: posts }] = await Promise.all([
    auth.supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
    auth.supabase.from("content_categories").select("content_id", { count: "exact", head: true }).eq("category_id", id),
  ]);
  if ((kids ?? 0) > 0) return { ok: false, error: `It has ${kids} subcategor${kids === 1 ? "y" : "ies"}. Move, merge or delete those first.` };
  if ((posts ?? 0) > 0) return { ok: false, error: `${posts} post${posts === 1 ? " uses" : "s use"} this category. Use Merge to move them to another category, or hide it instead.` };
  const { error } = await auth.supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

export async function mergeBlogCategory(fromId: string, intoId: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID.test(fromId) || !UUID.test(intoId)) return { ok: false, error: "Choose the category to merge into." };
  const { error } = await auth.supabase.rpc("merge_categories", { p_from: fromId, p_into: intoId });
  if (error) return { ok: false, error: error.message.replace(/^.*?exception:?\s*/i, "") };
  refresh();
  return { ok: true };
}
