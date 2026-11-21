// Internal linking: resolves the two-way "related items" graph (see
// 0023_related_items.sql) into displayable cards. A relation row is stored
// once but shown on BOTH sides — from either item's point of view, "the
// other one" is whichever side it isn't. Uses the request-scoped client so
// RLS applies exactly as everywhere else in lib/data.ts: an anonymous
// visitor only ever resolves to published items, staff previewing a draft
// see everything.

import { createClient } from "@/lib/supabase/server";

export type LinkableType = "content" | "book" | "service";

export type RelatedItem = {
  type: LinkableType;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  href: string;
  kicker: string;
};

export const RELATED_KICKER: Record<LinkableType, string> = { content: "ARTICLE", book: "BOOK", service: "SERVICE" };
const ROUTE: Record<LinkableType, (slug: string) => string> = {
  content: (slug) => `/articles/${slug}`,
  book: (slug) => `/books/${slug}`,
  service: (slug) => `/services/${slug}`,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Other = { type: LinkableType; id: string };

/** The rows naming `sourceType`/`sourceId` on either side, each reduced to "the other item". Exported for the admin picker (src/lib/admin/related-actions.ts), which needs the relation row id too. */
export async function resolveOthers(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  sourceType: LinkableType,
  sourceId: string
): Promise<(Other & { relationId: string })[]> {
  const { data: rows } = await supabase
    .from("related_items")
    .select("id,source_type,source_id,target_type,target_id,display_order")
    .or(`and(source_type.eq.${sourceType},source_id.eq.${sourceId}),and(target_type.eq.${sourceType},target_id.eq.${sourceId})`)
    .order("display_order", { ascending: true });
  if (!rows) return [];
  return rows.map((r) => {
    const isSource = r.source_type === sourceType && r.source_id === sourceId;
    return isSource
      ? { relationId: r.id, type: r.target_type as LinkableType, id: r.target_id }
      : { relationId: r.id, type: r.source_type as LinkableType, id: r.source_id };
  });
}

export async function fetchTitles(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  others: Other[]
): Promise<Map<string, { title: string; slug?: string; excerpt?: string; imageUrl?: string }>> {
  const byType: Record<LinkableType, string[]> = { content: [], book: [], service: [] };
  for (const o of others) byType[o.type].push(o.id);

  const [contentRes, bookRes, serviceRes] = await Promise.all([
    byType.content.length
      ? supabase.from("content").select("id,slug,title,dek,excerpt,featured_image_url").in("id", byType.content)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; dek: string | null; excerpt: string | null; featured_image_url: string | null }[] }),
    byType.book.length
      ? supabase.from("books").select("id,slug,title,excerpt,cover_image_url").in("id", byType.book)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; excerpt: string | null; cover_image_url: string | null }[] }),
    byType.service.length
      ? supabase.from("services").select("id,slug,title,short_description,featured_image_url").in("id", byType.service)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; short_description: string | null; featured_image_url: string | null }[] }),
  ]);

  const map = new Map<string, { title: string; slug?: string; excerpt?: string; imageUrl?: string }>();
  for (const r of contentRes.data ?? []) map.set(`content:${r.id}`, { title: r.title, slug: r.slug, excerpt: r.dek || r.excerpt || "", imageUrl: r.featured_image_url ?? undefined });
  for (const r of bookRes.data ?? []) map.set(`book:${r.id}`, { title: r.title, slug: r.slug, excerpt: r.excerpt || "", imageUrl: r.cover_image_url ?? undefined });
  for (const r of serviceRes.data ?? []) map.set(`service:${r.id}`, { title: r.title, slug: r.slug, excerpt: r.short_description || "", imageUrl: r.featured_image_url ?? undefined });
  return map;
}

/** Public: cards for the "Related" section on an item's own page. */
export async function getRelatedItems(sourceType: LinkableType, sourceId: string, limit = 6): Promise<RelatedItem[]> {
  if (!UUID_RE.test(sourceId)) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const others = await resolveOthers(supabase, sourceType, sourceId);
  if (others.length === 0) return [];
  const titles = await fetchTitles(supabase, others);

  const out: RelatedItem[] = [];
  for (const o of others) {
    const found = titles.get(`${o.type}:${o.id}`);
    // Missing = deleted, or unpublished and this viewer isn't staff (RLS already applied it).
    if (!found || !found.slug) continue;
    out.push({
      type: o.type,
      id: o.id,
      slug: found.slug,
      title: found.title,
      excerpt: found.excerpt ?? "",
      imageUrl: found.imageUrl,
      href: ROUTE[o.type](found.slug),
      kicker: RELATED_KICKER[o.type],
    });
    if (out.length >= limit) break;
  }
  return out;
}
