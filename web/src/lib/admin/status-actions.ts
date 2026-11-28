"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export type RowKind = "content" | "books" | "services" | "portfolio";
export type RowStatus = "draft" | "scheduled" | "published" | "archived";
export type RowResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Statuses each kind of item can actually hold (matching the database). */
const ALLOWED: Record<RowKind, RowStatus[]> = {
  content: ["draft", "scheduled", "published", "archived"],
  books: ["draft", "scheduled", "published", "archived"],
  services: ["draft", "published", "archived"],
  portfolio: ["draft", "published"],
};

async function refreshPublicPages(kind: RowKind, slug: string | null | undefined, inBlog?: boolean) {
  revalidatePath(`/admin/${kind}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (kind === "content") {
    revalidatePath("/articles");
    revalidatePath("/blog");
    if (slug) revalidatePath(`${inBlog ? "/blog" : "/articles"}/${slug}`);
  } else if (kind === "books") {
    revalidatePath("/books");
    if (slug) revalidatePath(`/books/${slug}`);
  } else if (kind === "services") {
    revalidatePath("/services");
    if (slug) revalidatePath(`/services/${slug}`);
  } else {
    revalidatePath("/work");
    if (slug) revalidatePath(`/work/${slug}`);
  }
}

/**
 * Publish, unpublish (back to draft), archive or restore one item, straight from the admin list.
 * Staff only. Publishing stamps the publish date (content and work items) if it has none yet, so it never goes live undated.
 */
export async function setItemStatus(kind: RowKind, id: string, status: RowStatus): Promise<RowResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!(kind in ALLOWED) || !UUID.test(id)) return { ok: false, error: "Item not found." };
  if (!ALLOWED[kind].includes(status)) return { ok: false, error: `A ${kind === "portfolio" ? "project" : kind.replace(/s$/, "")} can't be set to "${status}".` };
  const db = auth.supabase;
  const table = kind === "portfolio" ? "portfolio_items" : kind;

  const patch: Record<string, unknown> = { status };
  // Only content and work items carry a publish date; books and services have no such column.
  if (status === "published" && (kind === "content" || kind === "portfolio")) {
    const { data: cur } = await db.from(table).select("published_at").eq("id", id).maybeSingle();
    if (!cur?.published_at || new Date(cur.published_at).getTime() > Date.now()) patch.published_at = new Date().toISOString();
  }

  const cols = kind === "content" ? "slug,in_blog" : "slug";
  const { data, error } = await db.from(table).update(patch).eq("id", id).select(cols).maybeSingle();
  if (error) {
    // Work items refuse to publish until their label and permission are confirmed (a database rule).
    if (kind === "portfolio" && /check constraint/i.test(error.message)) return { ok: false, error: "Open the project and confirm permission or set an honest label before publishing." };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "Item not found." };
  const row = data as unknown as { slug?: string; in_blog?: boolean };
  await refreshPublicPages(kind, row.slug, row.in_blog);
  return { ok: true };
}

/**
 * Permanently deletes one item from the admin list. Unlike the delete buttons on the edit pages this
 * returns a result instead of redirecting, so the list can refresh in place.
 */
export async function deleteItem(kind: RowKind, id: string): Promise<RowResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!(kind in ALLOWED) || !UUID.test(id)) return { ok: false, error: "Item not found." };
  const db = auth.supabase;
  const table = kind === "portfolio" ? "portfolio_items" : kind;

  const cols = kind === "content" ? "slug,in_blog" : "slug";
  const { data: row } = await db.from(table).select(cols).eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "Item not found." };

  if (kind === "books") {
    // The rows cascade but the stored files don't, so remove them too (same as the Delete on the edit page).
    const { data: files } = await db.from("book_files").select("storage_path").eq("book_id", id);
    if (files?.length) {
      const admin = createAdminClient();
      if (admin) await admin.storage.from("book-files").remove(files.map((f) => f.storage_path));
    }
  }

  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  const r = row as unknown as { slug?: string; in_blog?: boolean };
  await refreshPublicPages(kind, r.slug, r.in_blog);
  return { ok: true };
}
