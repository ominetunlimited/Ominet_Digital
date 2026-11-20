"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { slugify } from "@/lib/slug";

export type CategoryInput = { id?: string; name: string; slug: string; description: string; order: number; enabled: boolean };
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveBlogCategory(input: CategoryInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const name = input.name.trim().slice(0, 60);
  const slug = slugify(input.slug || name);
  if (!name || !slug) return { ok: false, error: "A category needs a name." };
  const row = { name, slug, description: input.description.trim().slice(0, 200) || null, display_order: Math.trunc(input.order) || 0, blog_enabled: !!input.enabled };
  const { error } = input.id ? await auth.supabase.from("categories").update(row).eq("id", input.id) : await auth.supabase.from("categories").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? "A category with that name already exists." : error.message };
  revalidatePath("/blog"); revalidatePath("/admin/blog-categories");
  return { ok: true };
}

export async function deleteBlogCategory(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/blog"); revalidatePath("/admin/blog-categories");
  return { ok: true };
}
