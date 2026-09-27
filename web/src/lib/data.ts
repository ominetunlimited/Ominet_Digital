import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { formatMoney } from "@/lib/money";
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
  return formatMoney(cents, currency);
}

type ContentRow = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  excerpt: string | null;
  type: string;
  status?: string;
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
  attachment_format?: string | null;
  featured?: boolean | null;
  external_url?: string | null;
  external_label?: string | null;
  subcategory?: string | null;
};

function mapArticle(row: ContentRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    dek: row.dek ?? undefined,
    excerpt: row.excerpt ?? "",
    status: row.status,
    category: row.type.toUpperCase(),
    subcategory: row.subcategory ?? undefined,
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
    attachmentFormat: row.attachment_format === "pdf" || row.attachment_format === "docx" ? row.attachment_format : undefined,
    featured: row.featured ?? false,
    externalUrl: row.external_url ?? undefined,
    externalLabel: row.external_label ?? undefined,
  };
}

export async function getArticles(): Promise<Article[]> {
  if (!supabaseConfigured) return mockArticles;
  const supabase = await createClient();
  let { data, error } = await supabase!
    .from("content")
    .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes,attachment_format,featured,external_url,external_label,subcategory")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  // 42703 = undefined column — attachment_format (0021_content_attachments.sql),
  // featured/external_url/external_label (0022_content_extras.sql), or
  // subcategory (0024_content_subcategory.sql) may not be applied to this
  // project yet. Retry without them.
  if (error?.code === "42703") {
    const fallback = await supabase!
      .from("content")
      .select("id,slug,title,dek,excerpt,type,access,price_cents,currency,published_at,read_minutes")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    data = fallback.data?.map((r) => ({ ...r, attachment_format: null, featured: null, external_url: null, external_label: null, subcategory: null })) ?? null;
    error = fallback.error;
  }
  if (error || !data) return mockArticles;
  return data.map(mapArticle);
}

export async function getLatestArticle(): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles[0];
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  if (!supabaseConfigured) return mockArticles.find((a) => a.slug === slug);
  const supabase = await createClient();
  let { data, error } = await supabase!
    .from("content")
    .select("id,slug,title,dek,excerpt,type,status,access,price_cents,currency,published_at,read_minutes,body,seo_title,seo_description,og_image_url,featured_image_url,video_url,video_thumbnail_url,attachment_format,featured,external_url,external_label,subcategory")
    .eq("slug", slug)
    .maybeSingle();
  // 42703 = undefined column — the video_url/video_thumbnail_url migration
  // (0003_video_fields.sql), attachment_format (0021_content_attachments.sql),
  // featured/external_url/external_label (0022_content_extras.sql), or
  // subcategory (0024_content_subcategory.sql) may not be applied to this
  // project yet. Retry without those columns so the rest of the article
  // still loads.
  if (error?.code === "42703") {
    ({ data, error } = await supabase!
      .from("content")
      .select("id,slug,title,dek,excerpt,type,status,access,price_cents,currency,published_at,read_minutes,body,seo_title,seo_description,og_image_url,featured_image_url")
      .eq("slug", slug)
      .maybeSingle());
  }
  if (error || !data) return undefined;
  return mapArticle(data);
}

type BookRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  year: string | null;
  pages: string | null;
  excerpt: string | null;
  cover_image_url?: string | null;
  author_note?: string | null;
  author?: string | null;
  og_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  formats: string[] | null;
  status: string;
  featured?: boolean | null;
  book_purchase_links: { label: string; platform: string; url: string }[];
};

const BOOK_SELECT_MID = "id,slug,title,kind,year,pages,excerpt,cover_image_url,author_note,formats,status,featured,book_purchase_links(label,platform,url)";
// 0012_book_files.sql adds author + og_image_url; seo_* already existed.
const BOOK_SELECT = "id,slug,title,kind,year,pages,excerpt,cover_image_url,author_note,author,og_image_url,seo_title,seo_description,formats,status,featured,book_purchase_links(label,platform,url)";
// Fallback for before 0009_author_note.sql has been run — same "retry
// without the missing column" pattern used for video_url/video_thumbnail_url
// in content-actions.ts, so a pending migration can't take the whole Books
// section down to fake mock data via the catch-all error fallback below.
const BOOK_SELECT_SAFE = "id,slug,title,kind,year,pages,excerpt,cover_image_url,formats,status,featured,book_purchase_links(label,platform,url)";

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    year: row.year ?? "",
    pages: row.pages ?? undefined,
    excerpt: row.excerpt ?? "",
    coverImageUrl: row.cover_image_url ?? undefined,
    authorNote: row.author_note ?? undefined,
    author: row.author ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    purchaseLinks: (row.book_purchase_links ?? []).map((l) => ({ label: l.label, platform: l.platform, url: l.url })),
    formats: row.formats ?? [],
    status: row.status,
    upcoming: row.status !== "published",
    featured: row.featured ?? false,
  };
}

export async function getBooks(): Promise<{ published: Book[]; upcoming: Book[] }> {
  if (!supabaseConfigured) return { published: mockBooks, upcoming: mockUpcomingBooks };
  const supabase = await createClient();
  let data: unknown;
  let error: { code?: string } | null;
  ({ data, error } = await supabase!.from("books").select(BOOK_SELECT).order("year", { ascending: false }));
  for (const sel of [BOOK_SELECT_MID, BOOK_SELECT_SAFE]) {
    if (error?.code !== "42703" && error?.code !== "PGRST204") break;
    ({ data, error } = await supabase!.from("books").select(sel).order("year", { ascending: false }));
  }
  if (error || !data) return { published: mockBooks, upcoming: mockUpcomingBooks };
  const mapped = (data as unknown as BookRow[]).map(mapBook);
  return {
    published: mapped.filter((b) => !b.upcoming),
    upcoming: mapped.filter((b) => b.upcoming),
  };
}

export async function getFeaturedBook(): Promise<Book | undefined> {
  const { published } = await getBooks();
  if (published.length === 0) return undefined;
  return published.find((b) => b.featured) ?? published[0];
}

export async function getBook(slug: string): Promise<Book | undefined> {
  if (!supabaseConfigured) return mockBooks.find((b) => b.slug === slug);
  const supabase = await createClient();
  let data: unknown;
  let error: { code?: string } | null;
  ({ data, error } = await supabase!.from("books").select(BOOK_SELECT).eq("slug", slug).maybeSingle());
  for (const sel of [BOOK_SELECT_MID, BOOK_SELECT_SAFE]) {
    if (error?.code !== "42703" && error?.code !== "PGRST204") break;
    ({ data, error } = await supabase!.from("books").select(sel).eq("slug", slug).maybeSingle());
  }
  if (error || !data) return undefined;
  return mapBook(data as unknown as BookRow);
}

export async function getAllSlugs() {
  if (!supabaseConfigured) {
    return {
      articles: mockArticles.map((a) => a.slug),
      books: mockBooks.map((b) => b.slug),
      services: [] as string[],
    };
  }
  const supabase = await createClient();
  const [{ data: articleRows }, { data: bookRows }, { data: serviceRows }] = await Promise.all([
    supabase!.from("content").select("slug").eq("status", "published"),
    supabase!.from("books").select("slug"),
    supabase!.from("services").select("slug").eq("status", "published"),
  ]);
  return {
    articles: (articleRows ?? []).map((r) => r.slug as string),
    books: (bookRows ?? []).map((r) => r.slug as string),
    services: (serviceRows ?? []).map((r) => r.slug as string),
  };
}

export type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  priceCents: number | null;
  currency: string;
  access: string;
  externalUrl?: string;
  externalLabel?: string;
  affiliateDisclosure?: string;
};

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number | null;
  currency: string | null;
  access: string;
  external_url: string | null;
  external_label: string | null;
  affiliate_disclosure: string | null;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    priceCents: row.price_cents,
    currency: row.currency ?? "NGN",
    access: row.access,
    externalUrl: row.external_url ?? undefined,
    externalLabel: row.external_label ?? undefined,
    affiliateDisclosure: row.affiliate_disclosure ?? undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("products")
    .select("id,slug,title,description,image_url,price_cents,currency,access,external_url,external_label,affiliate_disclosure")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

export type ServiceFaq = { question: string; answer: string };

export type Service = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  featuredImageUrl?: string;
  gallery: string[];
  category?: string;
  priceCents: number | null;
  currency: string;
  pricingMode: string;
  duration?: string;
  availability?: string;
  locationMode: string;
  bookingEnabled: boolean;
  requirements?: string;
  faq: ServiceFaq[];
  externalBookingUrl?: string;
  ctaLabel?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  status?: string;
};

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  featured_image_url: string | null;
  gallery: string[] | null;
  category: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_mode: string;
  duration: string | null;
  availability: string | null;
  location_mode: string;
  booking_enabled: boolean;
  requirements: string | null;
  faq: ServiceFaq[] | null;
  external_booking_url: string | null;
  cta_label: string | null;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  status?: string;
};

const SERVICE_SELECT =
  "id,slug,title,short_description,full_description,featured_image_url,gallery,category,price_cents,currency,pricing_mode,duration,availability,location_mode,booking_enabled,requirements,faq,external_booking_url,cta_label,featured,seo_title,seo_description,og_image_url,status";

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description ?? undefined,
    fullDescription: row.full_description ?? undefined,
    featuredImageUrl: row.featured_image_url ?? undefined,
    gallery: row.gallery ?? [],
    category: row.category ?? undefined,
    priceCents: row.price_cents,
    currency: row.currency ?? "NGN",
    pricingMode: row.pricing_mode,
    duration: row.duration ?? undefined,
    availability: row.availability ?? undefined,
    locationMode: row.location_mode,
    bookingEnabled: row.booking_enabled,
    requirements: row.requirements ?? undefined,
    faq: row.faq ?? [],
    externalBookingUrl: row.external_booking_url ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    featured: row.featured,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    ogImageUrl: row.og_image_url ?? undefined,
    status: row.status,
  };
}

export async function getServices(): Promise<Service[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("services")
    .select(SERVICE_SELECT)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as ServiceRow[]).map(mapService);
}

export async function getService(slug: string): Promise<Service | undefined> {
  if (!supabaseConfigured) return undefined;
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("services")
    .select(SERVICE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return undefined;
  return mapService(data as unknown as ServiceRow);
}

export type MediaImage = { id: string; url: string; title: string | null; altText: string | null; caption: string | null };
export type VideoPost = { slug: string; title: string; videoUrl: string; videoThumbnailUrl?: string; readMinutes: number | null };

export async function getMediaPhotos(limit = 8): Promise<MediaImage[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("media_assets")
    .select("id,url,title,alt_text,caption")
    .eq("kind", "image")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id, url: r.url, title: r.title, altText: r.alt_text, caption: r.caption }));
}

export async function getVideoPosts(limit = 6): Promise<VideoPost[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase!
    .from("content")
    .select("slug,title,video_url,video_thumbnail_url,read_minutes")
    .eq("status", "published")
    .not("video_url", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({ slug: r.slug, title: r.title, videoUrl: r.video_url as string, videoThumbnailUrl: r.video_thumbnail_url ?? undefined, readMinutes: r.read_minutes }));
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
