import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/og-image must stay fetchable: X and other crawlers read robots.txt before loading share images.
    rules: [{ userAgent: "*", allow: ["/", "/api/og-image"], disallow: ["/admin", "/checkout", "/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
