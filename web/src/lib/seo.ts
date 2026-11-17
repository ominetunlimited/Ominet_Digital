import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { ogImage } from "@/lib/og-image";

/** The one public address of the site. */
export const CANONICAL_URL = "https://www.ominetdigital.com.ng";
const ENV_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
// A *.vercel.app deployment address must never leak into canonical links, share
// previews, sitemaps or structured data — the real domain always wins.
export const SITE_URL = ENV_URL && !/\.vercel\.app$/i.test(ENV_URL) ? ENV_URL : process.env.NODE_ENV === "development" && !ENV_URL ? "http://localhost:3000" : CANONICAL_URL;
/** Built-in fallback name; the live name comes from Admin → Site settings. */
export const SITE_NAME = "Ominet Digital";

/**
 * Consistent title/description/OG/canonical for a static page. The site name is
 * appended by the root layout's title template, so renaming the site in Site
 * settings updates every page's title at once.
 */
export async function pageMetadata(title: string, description: string, path: string): Promise<Metadata> {
  const { identity, seo } = await getSiteSettings();
  const home = path === "/";
  const shownTitle = home ? identity.siteName : `${title} — ${identity.siteName}`;
  const images = [ogImage(seo.defaultOgImageUrl)];
  return {
    title: home ? { absolute: identity.siteName } : title,
    description: home ? identity.description : description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { title: shownTitle, description: home ? identity.description : description, url: `${SITE_URL}${path}`, siteName: identity.siteName, type: "website", images },
    twitter: { card: "summary_large_image", title: shownTitle, description: home ? identity.description : description, images },
  };
}
