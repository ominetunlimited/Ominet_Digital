import { SITE_PAGES, isPageOn, type PagesSettings } from "@/lib/site-pages";

export type NavLink = { href: string; label: string; external?: boolean };

/** Top-bar links: built-in pages that are on, then any tabs added in Admin → Pages. */
export function topNav(p: PagesSettings): NavLink[] {
  return [
    ...SITE_PAGES.filter((x) => x.inNav && isPageOn(p, x.key)).map((x) => ({ href: x.path, label: x.label })),
    ...p.custom.filter((c) => c.enabled).map((c) => ({ href: c.href, label: c.label, external: c.href.startsWith("https://") })),
  ];
}

/** Everything that is switched on, grouped for the mobile menu and footer. */
export function groupedNav(p: PagesSettings) {
  const on = SITE_PAGES.filter((x) => isPageOn(p, x.key));
  const pick = (g: string) => on.filter((x) => x.group === g).map((x) => ({ href: x.path, label: x.label }));
  return {
    main: [{ href: "/", label: "Home" }, ...pick("main")],
    ecosystem: pick("ecosystem"),
    utility: pick("utility"),
    custom: p.custom.filter((c) => c.enabled).map((c) => ({ href: c.href, label: c.label, external: c.href.startsWith("https://") })),
  };
}
