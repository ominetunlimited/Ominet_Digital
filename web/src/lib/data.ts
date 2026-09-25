import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import {
  articles as mockArticles,
  books as mockBooks,
  upcomingBooks as mockUpcomingBooks,
  type Article,
  type Book,
} from "@/lib/content";

// Data layer: reads from Supabase once a project is configured, otherwise
// falls back to the bundled placeholder fixtures in lib/content.ts (dev
// fixtures only — see project/README.md section 53). Every function here
// is the single place page components go for content, so wiring the real
// database touches this file, not every page.

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(cents: number | null, currency: string | null): string | undefined {
  if (cents == null) return undefined;
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : `${currency ?? ""} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

type ContentRow = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  excerpt: string | null;
  type: string;
  access: string;
  price_cents: number | null;
  currency: string | null;
  published_at: string | null;
  read_minutes: number | null;
  body?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  featured_image_url?: string | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
};

function mapArticle(row: ContentRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    dek: row.dek ?? undefined,
    excerpt: row.excerpt ?? "",
    category: row.type.toUpperCase(),
    access: row.access as Article["access"],
    price: formatPrice(row.price_cents, row.currency),
    date: formatDate(row.published_at),
    readTime: row.read_minutes ? `${row.read_minutes} min` : "",
    author: "Omini Nfawa",
    body: row.body ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    featuredImageUrl: row.featured_image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    videoThumbnailUrl: row.video_thumbnail_url ?? undefined,
  };
}

export async function getArticles(): Promise<Article[]> {
  if (!supabaseConfigured) return mockArticles;
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("content")
    .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error || !data) return mockArticles;
  return data.map(mapArticle);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  if (!supabaseConfigured) return mockArticles.find((a) => a.slug === slug);
  const supabase = await createClient();
  let { data, error } = await supabase!
    .from("content")
    .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes,body,seo_title,seo_description,og_image_url,featured_image_url,video_url,video_thumbnail_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  // 42703 = undefined column — the video_url/video_thumbnail_url migration
  // (0003_video_fields.sql) may not be applied to this project yet. Retry
  // without those columns so the rest of the article still loads.
  if (error?.code === "42703") {
    ({ data, error } = await supabase!
      .from("content")
      .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes,body,seo_title,seo_description,og_image_url,featured_image_url")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle());
  }
  if (error || !data) return undefined;
  return mapArticle(data);
}

type BookRow = {
  slug: string;
  title: string;
  kind: string;
  year: string | null;
  pages: string | null;
  excerpt: string | null;
  cover_image_url?: string | null;
  formats: string[] | null;
  status: string;
  book_purchase_links: { label: string; platform: string; url: string }[];
};

function mapBook(row: BookRow): Book {
  return {
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    year: row.year ?? "",
    pages: row.pages ?? undefined,
    excerpt: row.excerpt ?? "",
    coverImageUrl: row.cover_image_url ?? undefined,
    purchaseLinks: (row.book_purchase_links ?? []).map((l) => ({ label: l.label, platform: l.platform, url: l.url })),
    formats: row.formats ?? [],
    upcoming: row.status !== "published",
  };
}

export async function getBooks(): Promise<{ published: Book[]; upcoming: Book[] }> {
  if (!supabaseConfigured) return { published: mockBooks, upcoming: mockUpcomingBooks };
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("books")
    .select("slug,title,kind,year,pages,excerpt,cover_image_url,formats,status,book_purchase_links(label,platform,url)")
    .order("year", { ascending: false });
  if (error || !data) return { published: mockBooks, upcoming: mockUpcomingBooks };
  const mapped = (data as unknown as BookRow[]).map(mapBook);
  return {
    published: mapped.filter((b) => !b.upcoming),
    upcoming: mapped.filter((b) => b.upcoming),
  };
}

export async function getBook(slug: string): Promise<Book | undefined> {
  if (!supabaseConfigured) return mockBooks.find((b) => b.slug === slug);
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("books")
    .select("slug,title,kind,year,pages,excerpt,cover_image_url,formats,status,book_purchase_links(label,platform,url)")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return undefined;
  return mapBook(data as unknown as BookRow);
}

export async function getAllSlugs() {
  if (!supabaseConfigured) {
    return {
      articles: mockArticles.map((a) => a.slug),
      books: mockBooks.map((b) => b.slug),
    };
  }
  const supabase = await createClient();
  const [{ data: articleRows }, { data: bookRows }] = await Promise.all([
    supabase!.from("content").select("slug").eq("status", "published"),
    supabase!.from("books").select("slug"),
  ]);
  return {
    articles: (articleRows ?? []).map((r) => r.slug as string),
    books: (bookRows ?? []).map((r) => r.slug as string),
  };
}

export type AdPlacement = {
  slotKey: string;
  provider: string;
  adClient: string | null;
  adSlot: string | null;
  htmlSnippet: string | null;
  active: boolean;
};

export async function getAdPlacement(slotKey: string): Promise<AdPlacement | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase!
    .from("ad_placements")
    .select("slot_key,provider,ad_client,ad_slot,html_snippet,active")
    .eq("slot_key", slotKey)
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    slotKey: data.slot_key,
    provider: data.provider,
    adClient: data.ad_client,
    adSlot: data.ad_slot,
    htmlSnippet: data.html_snippet,
    active: data.active,
  };
}

export async function searchContent(query: string) {
  const q = query.trim();
  if (!q) return { articles: [] as Article[], books: [] as Book[] };
  if (!supabaseConfigured) {
    const lower = q.toLowerCase();
    return {
      articles: mockArticles.filter((a) => a.title.toLowerCase().includes(lower) || a.excerpt.toLowerCase().includes(lower)),
      books: mockBooks.filter((b) => b.title.toLowerCase().includes(lower)),
    };
  }
  const supabase = await createClient();
  const [{ data: articleRows }, { data: bookRows }] = await Promise.all([
    supabase!
      .from("content")
      .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes")
      .eq("status", "published")
      .ilike("title", `%${q}%`)
      .limit(10),
    supabase!.from("books").select("slug,title,kind,year,pages,excerpt,formats,status,book_purchase_links(label,platform,url)").ilike("title", `%${q}%`).limit(10),
  ]);
  return {
    articles: (articleRows ?? []).map(mapArticle),
    books: ((bookRows ?? []) as unknown as BookRow[]).map(mapBook),
  };
}
