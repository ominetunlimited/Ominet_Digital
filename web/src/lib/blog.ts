import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BlogPost = {
  id: string; slug: string; title: string; dek: string | null; excerpt: string | null; body: string | null; type: string;
  featuredImageUrl: string | null; featuredImageAlt: string | null; socialImageUrl: string | null; socialImageAlt: string | null; ogImageUrl: string | null;
  seoTitle: string | null; seoDescription: string | null; publishedAt: string | null; updatedAt: string | null; readMinutes: number | null;
  authorName: string; authorBio: string | null; category: { name: string; slug: string } | null; tags: { name: string; slug: string }[]; featured: boolean; status: string;
  categories: PostCategory[]; subcategories: PostCategory[];
  editorialLabel: string | null; disclosure: string | null; correctionNote: string | null; imageCredit: string | null; contributors: string | null;
};
export type PostCategory = { id: string; name: string; slug: string; parentId: string | null; primary: boolean };
export type BlogCategory = { id: string; name: string; slug: string; description: string | null; order: number };
export type CategoryNode = BlogCategory & { parentId: string | null; imageUrl: string | null; seoTitle: string | null; seoDescription: string | null; count: number; children: CategoryNode[] };

export const PAGE_SIZE = 9;
export const DEFAULT_AUTHOR = "Omini Nfawa";
const COLS = "id,slug,title,dek,excerpt,body,type,featured_image_url,featured_image_alt,social_image_url,social_image_alt,og_image_url,seo_title,seo_description,published_at,updated_at,read_minutes,author_name,author_bio,blog_featured,status,editorial_label,disclosure,correction_note,image_credit,contributors,categories(name,slug),content_tags(tags(name,slug)),content_categories(is_primary,categories(id,name,slug,parent_id))";
const LIST_COLS = COLS.replace("body,", "");

type Row = Record<string, unknown>;
function map(r: Row): BlogPost {
  const cat = r.categories as { name: string; slug: string } | null;
  const tags = ((r.content_tags as { tags: { name: string; slug: string } | null }[] | null) ?? []).map((t) => t.tags).filter(Boolean) as { name: string; slug: string }[];
  const links = ((r.content_categories as { is_primary: boolean; categories: { id: string; name: string; slug: string; parent_id: string | null } | null }[] | null) ?? [])
    .filter((l) => l.categories).map((l) => ({ id: l.categories!.id, name: l.categories!.name, slug: l.categories!.slug, parentId: l.categories!.parent_id, primary: l.is_primary }));
  const primary = links.find((l) => l.primary);
  return {
    categories: links.filter((l) => !l.parentId), subcategories: links.filter((l) => l.parentId),
    editorialLabel: (r.editorial_label as string) ?? null, disclosure: (r.disclosure as string) ?? null, correctionNote: (r.correction_note as string) ?? null,
    imageCredit: (r.image_credit as string) ?? null, contributors: (r.contributors as string) ?? null,
    id: r.id as string, slug: r.slug as string, title: r.title as string, dek: (r.dek as string) ?? null, excerpt: (r.excerpt as string) ?? null, body: (r.body as string) ?? null, type: r.type as string,
    featuredImageUrl: (r.featured_image_url as string) ?? null, featuredImageAlt: (r.featured_image_alt as string) ?? null, socialImageUrl: (r.social_image_url as string) ?? null,
    socialImageAlt: (r.social_image_alt as string) ?? null, ogImageUrl: (r.og_image_url as string) ?? null, seoTitle: (r.seo_title as string) ?? null, seoDescription: (r.seo_description as string) ?? null,
    publishedAt: (r.published_at as string) ?? null, updatedAt: (r.updated_at as string) ?? null, readMinutes: (r.read_minutes as number) ?? null,
    authorName: ((r.author_name as string) || DEFAULT_AUTHOR), authorBio: (r.author_bio as string) ?? null, category: primary ? { name: primary.name, slug: primary.slug } : cat ?? null, tags, featured: Boolean(r.blog_featured), status: r.status as string,
  };
}

/** Scheduled posts whose time has come are published here, so no background scheduler is needed. */
export async function promoteDue() {
  try { await createAdminClient()?.rpc("publish_due_content"); } catch { /* best effort */ }
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const tree = await getCategoryTree();
  return tree.map(({ id, name, slug, description, order }) => ({ id, name, slug, description, order }));
}

type CatRow = { id: string; name: string; slug: string; description: string | null; display_order: number; parent_id: string | null; image_url: string | null; seo_title: string | null; seo_description: string | null; show_when_empty: boolean };

/**
 * The public taxonomy: main categories with their subcategories and the number of PUBLISHED blog posts in each.
 * Empty categories are hidden unless an administrator marked them "show when empty".
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const db = await createClient();
  if (!db) return [];
  const [{ data: cats }, { data: links }] = await Promise.all([
    db.from("categories").select("id,name,slug,description,display_order,parent_id,image_url,seo_title,seo_description,show_when_empty").eq("blog_enabled", true).order("display_order"),
    db.from("content_categories").select("category_id,content!inner(status,in_blog)").eq("content.status", "published").eq("content.in_blog", true).limit(5000),
  ]);
  const counts = new Map<string, number>();
  for (const l of links ?? []) counts.set(l.category_id as string, (counts.get(l.category_id as string) ?? 0) + 1);
  const nodes = ((cats ?? []) as CatRow[]).map((c): CategoryNode => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description, order: c.display_order, parentId: c.parent_id, imageUrl: c.image_url,
    seoTitle: c.seo_title, seoDescription: c.seo_description, count: counts.get(c.id) ?? 0, children: [],
  }));
  const showEmpty = new Set(((cats ?? []) as CatRow[]).filter((c) => c.show_when_empty).map((c) => c.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: CategoryNode[] = [];
  for (const n of nodes) {
    if (n.parentId && byId.has(n.parentId)) byId.get(n.parentId)!.children.push(n);
    else if (!n.parentId) roots.push(n);
  }
  const visible = (n: CategoryNode) => n.count > 0 || showEmpty.has(n.id);
  return roots.map((r) => ({ ...r, children: r.children.filter(visible) })).filter(visible);
}

export async function getCategoryBySlug(slug: string): Promise<{ node: CategoryNode; parent: CategoryNode | null } | null> {
  const tree = await getCategoryTree();
  for (const r of tree) {
    if (r.slug === slug) return { node: r, parent: null };
    const c = r.children.find((x) => x.slug === slug);
    if (c) return { node: c, parent: r };
  }
  return null;
}

const clean = (q: string) => q.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);

export async function getBlogIndex(opts: { q?: string; category?: string; month?: string; page?: number }) {
  await promoteDue();
  const db = await createClient();
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  if (!db) return { posts: [] as BlogPost[], total: 0, page, pages: 1 };
  let query = db!.from("content").select(LIST_COLS, { count: "exact" }).eq("in_blog", true).eq("status", "published").order("published_at", { ascending: false });
  const q = clean(opts.q ?? "");
  if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,dek.ilike.%${q}%`);
  if (opts.category) {
    const { data: c } = await db!.from("categories").select("id").eq("slug", opts.category).eq("blog_enabled", true).maybeSingle();
    if (!c) return { posts: [] as BlogPost[], total: 0, page, pages: 1 };
    // Many-to-many: a post appears in every category it belongs to, but keeps one canonical URL.
    const { data: ids } = await db!.from("content_categories").select("content_id").eq("category_id", c.id).limit(5000);
    const list = (ids ?? []).map((i) => i.content_id as string);
    if (!list.length) return { posts: [] as BlogPost[], total: 0, page, pages: 1 };
    query = query.in("id", list);
  }
  if (opts.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(opts.month)) {
    const [y, m] = opts.month.split("-").map(Number);
    query = query.gte("published_at", new Date(Date.UTC(y, m - 1, 1)).toISOString()).lt("published_at", new Date(Date.UTC(y, m, 1)).toISOString());
  }
  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  return { posts: (data ?? []).map((r) => map(r as unknown as Row)), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const db = await createClient();
  if (!db) return null;
  const base = () => db!.from("content").select(LIST_COLS).eq("in_blog", true).eq("status", "published");
  const { data: f } = await base().eq("blog_featured", true).order("published_at", { ascending: false }).limit(1).maybeSingle();
  if (f) return map(f as unknown as Row);
  const { data: l } = await base().order("published_at", { ascending: false }).limit(1).maybeSingle();
  return l ? map(l as unknown as Row) : null;
}

export async function getArchiveMonths(): Promise<{ key: string; label: string; count: number }[]> {
  const db = await createClient();
  if (!db) return [];
  const { data } = await db!.from("content").select("published_at").eq("in_blog", true).eq("status", "published").not("published_at", "is", null).order("published_at", { ascending: false }).limit(1000);
  const by = new Map<string, number>();
  for (const r of data ?? []) { const k = String(r.published_at).slice(0, 7); by.set(k, (by.get(k) ?? 0) + 1); }
  return [...by.entries()].map(([key, count]) => ({ key, count, label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) }));
}

/** Drafts, scheduled and archived posts are visible only to signed-in staff (via RLS) and are marked noindex by the page. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  await promoteDue();
  const db = await createClient();
  if (!db) return null;
  const { data } = await db!.from("content").select(COLS).eq("slug", slug).eq("in_blog", true).maybeSingle();
  return data ? map(data as unknown as Row) : null;
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const db = await createClient();
  if (!db) return [];
  const picked: BlogPost[] = [];
  const { data: links } = await db!.from("related_items").select("target_id").eq("source_type", "content").eq("source_id", post.id).eq("target_type", "content").limit(limit);
  const ids = (links ?? []).map((l) => l.target_id as string);
  if (ids.length) {
    const { data } = await db!.from("content").select(LIST_COLS).in("id", ids).eq("in_blog", true).eq("status", "published");
    picked.push(...(data ?? []).map((r) => map(r as unknown as Row)));
  }
  if (picked.length < limit && post.categories.length) {
    const { data: shared } = await db!.from("content_categories").select("content_id").in("category_id", post.categories.map((c) => c.id)).limit(500);
    const sharedIds = [...new Set((shared ?? []).map((x) => x.content_id as string))].filter((id) => id !== post.id);
    if (sharedIds.length) {
      const { data } = await db!.from("content").select(LIST_COLS).in("id", sharedIds).eq("in_blog", true).eq("status", "published").order("published_at", { ascending: false }).limit(limit * 2);
      for (const r of data ?? []) { const p = map(r as unknown as Row); if (!picked.some((x) => x.id === p.id)) picked.push(p); }
    }
  }
  if (picked.length < limit) {
    const { data } = await db!.from("content").select(LIST_COLS).eq("in_blog", true).eq("status", "published").neq("id", post.id).order("published_at", { ascending: false }).limit(limit);
    for (const r of data ?? []) { const p = map(r as unknown as Row); if (!picked.some((x) => x.id === p.id)) picked.push(p); }
  }
  return picked.filter((p) => p.id !== post.id).slice(0, limit);
}

export async function getBlogSlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
  await promoteDue();
  const db = await createClient();
  if (!db) return [];
  const { data } = await db!.from("content").select("slug,updated_at").eq("in_blog", true).eq("status", "published");
  return (data ?? []).map((r) => ({ slug: r.slug as string, updatedAt: (r.updated_at as string) ?? null }));
}

export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }) : "");
export const readLabel = (m: number | null) => (m ? `${m} min read` : "");
