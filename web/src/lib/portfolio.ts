import { cache } from "react";
import { createClient as createAnon } from "@supabase/supabase-js";
import { createClient as createServer } from "@/lib/supabase/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";

/** Cookie-less client for public reads, so these pages stay statically cacheable. */
const anon = () => createAnon(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

export { LABELS } from "@/lib/portfolio-labels";

export type PortfolioMedia = { id: string; kind: string; url: string; title: string | null; caption: string | null; order: number };
export type PortfolioItem = {
  id: string; slug: string; title: string; summary: string | null; label: string; clientName: string | null; role: string | null;
  yearLabel: string | null; services: string | null; body: string | null; coverImageUrl: string | null; featured: boolean;
  seoTitle: string | null; seoDescription: string | null; publishedAt: string | null; updatedAt: string; media: PortfolioMedia[];
};

type Row = {
  id: string; slug: string; title: string; summary: string | null; label: string; client_name: string | null; role: string | null;
  year_label: string | null; services: string | null; body_html: string | null; cover_image_url: string | null; featured: boolean;
  seo_title: string | null; seo_description: string | null; published_at: string | null; updated_at: string;
  portfolio_media?: { id: string; kind: string; url: string; title: string | null; caption: string | null; display_order: number }[] | null;
};

const map = (r: Row): PortfolioItem => ({
  id: r.id, slug: r.slug, title: r.title, summary: r.summary, label: r.label, clientName: r.client_name, role: r.role, yearLabel: r.year_label,
  services: r.services, body: r.body_html, coverImageUrl: r.cover_image_url, featured: r.featured, seoTitle: r.seo_title,
  seoDescription: r.seo_description, publishedAt: r.published_at, updatedAt: r.updated_at,
  media: (r.portfolio_media ?? []).map((m) => ({ id: m.id, kind: m.kind, url: m.url, title: m.title, caption: m.caption, order: m.display_order })).sort((a, b) => a.order - b.order),
});

const COLS = "id,slug,title,summary,label,client_name,role,year_label,services,body_html,cover_image_url,featured,seo_title,seo_description,published_at,updated_at";

export const getPortfolio = cache(async (): Promise<PortfolioItem[]> => {
  if (!supabaseConfigured) return [];
  const supabase = anon();
  const { data } = await supabase.from("portfolio_items").select(COLS).eq("status", "published").order("featured", { ascending: false }).order("display_order").order("published_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(map);
});

export async function getPortfolioItem(slug: string, includeDraft = false): Promise<PortfolioItem | null> {
  if (!supabaseConfigured) return null;
  const supabase = includeDraft ? await createServer() : anon();
  if (!supabase) return null;
  let q = supabase.from("portfolio_items").select(`${COLS},portfolio_media(id,kind,url,title,caption,display_order)`).eq("slug", slug);
  if (!includeDraft) q = q.eq("status", "published");
  const { data } = await q.maybeSingle();
  return data ? map(data as unknown as Row) : null;
}

export const countPublishedPortfolio = cache(async (): Promise<number> => {
  if (!supabaseConfigured) return 0;
  try {
  const supabase = anon();
  const { count } = await supabase.from("portfolio_items").select("id", { count: "exact", head: true }).eq("status", "published");
  return count ?? 0;
  } catch { return 0; }
});
