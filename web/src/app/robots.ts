import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /s/ (short share links) must stay fetchable too: X and other preview bots read robots.txt before following the redirect.
    // The redirect itself carries X-Robots-Tag: noindex, so it stays out of search results.
    // /api/og-image must stay fetchable: X and other crawlers read robots.txt before loading share images.
    rules: [{ userAgent: "*", allow: ["/", "/api/og-image"], disallow: ["/admin", "/checkout", "/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
