import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllSlugs } from "@/lib/data";

const STATIC_ROUTES = [
  "", "/omini-nfawa", "/cortexa-office", "/writing", "/books", "/media",
  "/services", "/ominet-digital", "/profile", "/store", "/about", "/search",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { articles, books, services } = await getAllSlugs();

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() })),
    ...articles.map((slug) => ({ url: `${SITE_URL}/writing/${slug}`, lastModified: new Date() })),
    ...books.map((slug) => ({ url: `${SITE_URL}/books/${slug}`, lastModified: new Date() })),
    ...services.map((slug) => ({ url: `${SITE_URL}/services/${slug}`, lastModified: new Date() })),
  ];
}
