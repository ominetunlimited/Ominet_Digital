import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllSlugs } from "@/lib/data";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_PAGES, isPageOn } from "@/lib/site-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, books, services } = await getAllSlugs();
  const { pages } = await getSiteSettings();
  const on = (k: string) => isPageOn(pages, k);
  const STATIC_ROUTES = ["", "/discuss-a-project", ...SITE_PAGES.filter((p) => on(p.key)).map((p) => p.path)];

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })),
    ...(on("writing") ? articles : []).map((slug) => ({ url: `${SITE_URL}/writing/${slug}`, lastModified: new Date() })),
    ...(on("books") ? books : []).map((slug) => ({ url: `${SITE_URL}/books/${slug}`, lastModified: new Date() })),
    ...(on("services") ? services : []).map((slug) => ({ url: `${SITE_URL}/services/${slug}`, lastModified: new Date() })),
  ];
}
