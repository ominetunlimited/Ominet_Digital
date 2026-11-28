"use server";

import { requireStaff } from "@/lib/auth/guard";
import { getShortUrl } from "@/lib/short-links";
import { SITE_URL } from "@/lib/seo";

export type ShareKind = "content" | "books" | "services";
export type ShareInfo =
  | { ok: true; url: string; shortUrl: string | null; title: string; excerpt: string | null }
  | { ok: false; error: string };

/**
 * Everything the admin Share panel needs for one published item: its public address, the short link
 * (created on first use), the title and a short excerpt. Staff only. Unpublished items are refused,
 * because their public address would show a 404 to the people the link is shared with.
 */
export async function getShareInfo(kind: ShareKind, id: string): Promise<ShareInfo> {
  const guard = await requireStaff();
  if (!guard.ok) return { ok: false, error: guard.error };
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Item not found." };
  const db = guard.supabase;

  let path = "";
  let title = "";
  let excerpt: string | null = null;
  if (kind === "content") {
    const { data } = await db.from("content").select("slug,title,excerpt,dek,status,in_blog").eq("id", id).maybeSingle();
    if (!data) return { ok: false, error: "Item not found." };
    if (data.status !== "published") return { ok: false, error: "Publish this item first. Its public page is not live yet." };
    path = `${data.in_blog ? "/blog" : "/articles"}/${data.slug}`;
    title = data.title;
    excerpt = data.excerpt || data.dek || null;
  } else if (kind === "books") {
    const { data } = await db.from("books").select("slug,title,excerpt,status").eq("id", id).maybeSingle();
    if (!data) return { ok: false, error: "Item not found." };
    if (data.status !== "published") return { ok: false, error: "Publish this book first. Its public page is not live yet." };
    path = `/books/${data.slug}`;
    title = data.title;
    excerpt = data.excerpt || null;
  } else {
    const { data } = await db.from("services").select("slug,title,short_description,status").eq("id", id).maybeSingle();
    if (!data) return { ok: false, error: "Item not found." };
    if (data.status !== "published") return { ok: false, error: "Publish this service first. Its public page is not live yet." };
    path = `/services/${data.slug}`;
    title = data.title;
    excerpt = data.short_description || null;
  }

  return { ok: true, url: `${SITE_URL}${path}`, shortUrl: await getShortUrl(path), title, excerpt };
}
