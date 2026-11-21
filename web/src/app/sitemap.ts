import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllSlugs } from "@/lib/data";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_PAGES, isPageOn } from "@/lib/site-pages";
import { getBlogSlugs, getCategoryTree } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, books, services } = await getAllSlugs();
  const { pages } = await getSiteSettings();
  const blogPosts = isPageOn(pages, "blog") ? await getBlogSlugs() : [];
  const on = (k: string) => isPageOn(pages, k);
  const cats = on("blog") ? (await getCategoryTree()).flatMap((c) => [c, ...c.children]).filter((c) => c.count > 0) : [];
  const STATIC_ROUTES = ["", "/discuss-a-project", "/contact", "/terms", "/cookies", "/privacy", ...SITE_PAGES.filter((p) => on(p.key)).map((p) => p.path)];

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })),
    ...(on("writing") ? articles : []).map((slug) => ({ url: `${SITE_URL}/articles/${slug}`, lastModified: new Date() })),
    ...blogPosts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date() })),
    ...cats.map((c) => ({ url: `${SITE_URL}/blog/category/${c.slug}`, lastModified: new Date() })),
    ...(on("books") ? books : []).map((slug) => ({ url: `${SITE_URL}/books/${slug}`, lastModified: new Date() })),
    ...(on("services") ? services : []).map((slug) => ({ url: `${SITE_URL}/services/${slug}`, lastModified: new Date() })),
  ];
}
