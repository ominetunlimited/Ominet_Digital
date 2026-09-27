import { SITE_URL } from "@/lib/seo";

/**
 * Turns a cover/featured image into something WhatsApp, Facebook etc. will
 * actually preview. Their crawlers fetch og:image directly and are strict
 * about size — a raw admin upload (a full-resolution book cover can be
 * several MB) routinely times out or gets silently dropped, which is why a
 * share can show no thumbnail at all even though the page has a perfectly
 * good cover. Routes it through /api/og-image (see that route) to get a
 * small, share-safe JPEG instead of asking uploaders to manage two versions
 * of every image.
 *
 * With no image at all, falls back to a pre-rendered brand card (logo,
 * centered, on the site's navy) rather than omitting og:image — a share
 * with no image at all looks broken; this always looks intentional.
 */
export function ogImage(rawUrl?: string | null): { url: string; width?: number; height?: number } {
  if (!rawUrl) return { url: `${SITE_URL}/images/og-default.png`, width: 1200, height: 630 };
  const absolute = rawUrl.startsWith("/") ? `${SITE_URL}${rawUrl}` : rawUrl;
  return { url: `${SITE_URL}/api/og-image?url=${encodeURIComponent(absolute)}` };
}
