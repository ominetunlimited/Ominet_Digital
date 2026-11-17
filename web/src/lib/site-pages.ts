// The site's switchable pages. Dependency-free so it can be shared by the
// server (guards, sitemap, nav) and the Admin → Pages screen.
//
// Built-in pages are listed here once. New top-level tabs that you add later
// from Admin → Pages are stored as "custom links" in site settings, so a new
// tab never needs a code change.

export type SitePage = { key: string; label: string; path: string; inNav: boolean; group: "main" | "ecosystem" | "utility"; note?: string };

export const SITE_PAGES: SitePage[] = [
  { key: "omini-nfawa", label: "Omini Nfawa", path: "/omini-nfawa", inNav: true, group: "main" },
  { key: "writing", label: "Writing", path: "/writing", inNav: true, group: "main", note: "Articles, essays and blog posts" },
  { key: "books", label: "Books", path: "/books", inNav: true, group: "main" },
  { key: "media", label: "Media", path: "/media", inNav: true, group: "main" },
  { key: "services", label: "Services", path: "/services", inNav: true, group: "main" },
  { key: "profile", label: "PROFILE", path: "/profile", inNav: true, group: "ecosystem" },
  { key: "cortexa-office", label: "Cortexa Office", path: "/cortexa-office", inNav: true, group: "ecosystem" },
  { key: "about", label: "About", path: "/about", inNav: true, group: "main" },
  { key: "store", label: "Store", path: "/store", inNav: false, group: "ecosystem", note: "Shown in the footer and mobile menu" },
  { key: "ominet-digital", label: "Studio & services", path: "/ominet-digital", inNav: false, group: "ecosystem", note: "Shown in the footer" },
  { key: "search", label: "Search", path: "/search", inNav: false, group: "utility" },
];

export type CustomLink = { id: string; label: string; href: string; enabled: boolean };
export type PagesSettings = { enabled: Record<string, boolean>; custom: CustomLink[] };

export const DEFAULT_PAGES: PagesSettings = { enabled: {}, custom: [] };

/** A page is on unless an admin has switched it off. */
export const isPageOn = (p: PagesSettings, key: string) => p.enabled[key] !== false;

export function validatePages(input: unknown): { ok: true; value: PagesSettings } | { ok: false; error: string } {
  const o = (input ?? {}) as Record<string, unknown>;
  const known = new Set(SITE_PAGES.map((p) => p.key));
  const enabled: Record<string, boolean> = {};
  const raw = (o.enabled ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(raw)) if (known.has(k)) enabled[k] = Boolean(raw[k]);

  const custom: CustomLink[] = [];
  const list = Array.isArray(o.custom) ? o.custom.slice(0, 12) : [];
  const seen = new Set<string>();
  for (const item of list) {
    const c = (item ?? {}) as Record<string, unknown>;
    const label = typeof c.label === "string" ? c.label.trim().slice(0, 30) : "";
    const href = typeof c.href === "string" ? c.href.trim().slice(0, 300) : "";
    if (!label) return { ok: false, error: "Every new tab needs a name." };
    const internal = /^\/[A-Za-z0-9\-_/#?=&.]*$/.test(href) && !href.startsWith("//") && !href.startsWith("/admin");
    const external = /^https:\/\/[^\s]+$/.test(href);
    if (!internal && !external) return { ok: false, error: `"${label}": use a page path like /podcast, or a full https:// address.` };
    const id = (typeof c.id === "string" && /^[a-z0-9-]{3,40}$/.test(c.id) ? c.id : `tab-${seen.size + 1}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}`);
    if (seen.has(id)) return { ok: false, error: "Duplicate tab." };
    seen.add(id);
    custom.push({ id, label, href, enabled: Boolean(c.enabled) });
  }
  return { ok: true, value: { enabled, custom } };
}
