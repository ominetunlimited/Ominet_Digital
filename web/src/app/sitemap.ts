import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllSlugs, getMediaPhotos, getVideoPosts } from "@/lib/data";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_PAGES, isPageOn } from "@/lib/site-pages";
import { getPortfolio } from "@/lib/portfolio";
import { getBlogSlugs, getCategoryTree, MIN_INDEXABLE_CATEGORY_POSTS } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, books, services } = await getAllSlugs();
  const { pages, ecosystem } = await getSiteSettings();
  const blogPosts = isPageOn(pages, "blog") ? await getBlogSlugs() : [];
  const work = isPageOn(pages, "work") ? await getPortfolio() : [];
  const on = (k: string) => isPageOn(pages, k);
  // An empty portfolio is not offered to search engines (the page itself is noindex too).
  const [vids, pics] = await Promise.all([getVideoPosts(1), getMediaPhotos(1)]);
  const mediaEmpty = vids.length === 0 && pics.length === 0;
  const cats = on("blog") ? (await getCategoryTree()).flatMap((c) => [c, ...c.children]).filter((c) => c.count >= MIN_INDEXABLE_CATEGORY_POSTS) : [];
  const STATIC_ROUTES = ["", "/discuss-a-project", "/contact", "/terms", "/cookies", "/privacy", ...SITE_PAGES.filter((p) => on(p.key) && !(p.key === "profile" && !ecosystem.profileVisible) && !(p.key === "cortexa-office" && !ecosystem.cortexaVisible) && p.key !== "search" && !(p.key === "work" && work.length === 0) && !(p.key === "media" && mediaEmpty)).map((p) => p.path)];

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })),
    ...(on("writing") ? articles : []).map((slug) => ({ url: `${SITE_URL}/articles/${slug}`, lastModified: new Date() })),
    ...blogPosts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date() })),
    ...cats.map((c) => ({ url: `${SITE_URL}/blog/category/${c.slug}`, lastModified: new Date() })),
    ...(on("books") ? books : []).map((slug) => ({ url: `${SITE_URL}/books/${slug}`, lastModified: new Date() })),
    ...work.map((w) => ({ url: `${SITE_URL}/work/${w.slug}`, lastModified: new Date(w.updatedAt) })),
    ...(on("services") ? services : []).map((slug) => ({ url: `${SITE_URL}/services/${slug}`, lastModified: new Date() })),
  ];
}
