"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { sanitizeRichHtml } from "@/lib/rich-text";
import { slugify } from "@/lib/slug";
import { isHttps } from "@/lib/embed";

export type PortfolioMediaInput = { kind: string; url: string; title: string; caption: string };
export type PortfolioInput = {
  id?: string; title: string; slug: string; summary: string; label: string; client_name: string; role: string; year_label: string;
  services: string; body_html: string; cover_image_url: string; status: string; featured: boolean; display_order: number;
  permission_confirmed: boolean; seo_title: string; seo_description: string; media: PortfolioMediaInput[];
};
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const LABELS = ["personal", "simulated", "volunteer", "paid"];
const KINDS = ["image", "video", "slides", "pdf", "link"];

export async function savePortfolioItem(input: PortfolioInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the project a title." };
  const slug = slugify(input.slug || title);
  if (!slug) return { ok: false, error: "The web address (slug) needs some letters or numbers." };
  if (!LABELS.includes(input.label)) return { ok: false, error: "Choose what kind of project this is." };
  const status = input.status === "published" ? "published" : "draft";
  const needsPermission = input.label === "volunteer" || input.label === "paid";
  if (status === "published" && needsPermission && !input.permission_confirmed) {
    return { ok: false, error: "Confirm that you have permission to show this client work before publishing." };
  }
  if (input.cover_image_url && !isHttps(input.cover_image_url)) return { ok: false, error: "The cover image must be a secure (https) link or an uploaded image." };

  const media: PortfolioMediaInput[] = [];
  for (const m of input.media) {
    const url = m.url.trim();
    if (!url) continue;
    if (!KINDS.includes(m.kind)) return { ok: false, error: "One of the media items has an unknown type." };
    if (!isHttps(url)) return { ok: false, error: `"${url.slice(0, 60)}" is not a secure (https) link.` };
    media.push({ kind: m.kind, url, title: m.title.trim().slice(0, 140), caption: m.caption.trim().slice(0, 400) });
  }

  let previouslyPublishedAt: string | null = null;
  if (input.id) {
    const { data: ex } = await supabase.from("portfolio_items").select("published_at").eq("id", input.id).maybeSingle();
    previouslyPublishedAt = ex?.published_at ?? null;
  }

  const row = {
    slug, title,
    summary: input.summary.trim() || null,
    label: input.label,
    client_name: input.client_name.trim() || null,
    role: input.role.trim() || null,
    year_label: input.year_label.trim() || null,
    services: input.services.trim() || null,
    body_html: sanitizeRichHtml(input.body_html) || null,
    cover_image_url: input.cover_image_url.trim() || null,
    status,
    featured: input.featured,
    display_order: Number.isFinite(input.display_order) ? Math.round(input.display_order) : 0,
    permission_confirmed: input.permission_confirmed,
    seo_title: input.seo_title.trim() || null,
    seo_description: input.seo_description.trim() || null,
    published_at: status === "published" ? previouslyPublishedAt ?? new Date().toISOString() : previouslyPublishedAt,
    updated_at: new Date().toISOString(),
  };

  let id = input.id;
  if (id) {
    const { error } = await supabase.from("portfolio_items").update(row).eq("id", id);
    if (error) return { ok: false, error: error.code === "23505" ? "Another project already uses that web address." : error.message };
  } else {
    const { data, error } = await supabase.from("portfolio_items").insert(row).select("id").single();
    if (error) return { ok: false, error: error.code === "23505" ? "Another project already uses that web address." : error.message };
    id = data.id;
  }

  // Replace the media list as submitted (order follows the list).
  const del = await supabase.from("portfolio_media").delete().eq("item_id", id!);
  if (del.error) return { ok: false, error: del.error.message };
  if (media.length > 0) {
    const ins = await supabase.from("portfolio_media").insert(media.map((m, i) => ({ item_id: id!, kind: m.kind, url: m.url, title: m.title || null, caption: m.caption || null, display_order: i })));
    if (ins.error) return { ok: false, error: ins.error.message };
  }

  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  revalidatePath("/admin/portfolio");
  revalidatePath("/sitemap.xml");
  return { ok: true, id };
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.supabase.from("portfolio_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/work");
  revalidatePath("/admin/portfolio");
  return { ok: true };
}
