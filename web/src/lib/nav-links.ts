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

export type NavItem = { label: string; href?: string; external?: boolean; children?: NavLink[] };

/**
 * The header menu as visitors see it: a few clear groups instead of ten equal links.
 * Every entry still respects the on/off switches in Admin → Pages, and tabs added there appear at the end.
 */
export function structuredNav(p: PagesSettings, live: { profile: boolean; cortexa: boolean } = { profile: true, cortexa: true }): NavItem[] {
  const page = (key: string, label?: string): NavLink | null => {
    const x = SITE_PAGES.find((s) => s.key === key);
    return x && isPageOn(p, key) ? { href: x.path, label: label ?? x.label } : null;
  };
  const list = (items: (NavLink | null)[]) => items.filter((i): i is NavLink => i !== null);
  const group = (label: string, children: NavLink[]): NavItem | null =>
    children.length === 0 ? null : children.length === 1 ? { label, href: children[0].href } : { label, children };

  const items: (NavItem | null)[] = [
    group("Explore", list([page("blog"), page("writing"), page("books"), page("media")])),
    page("services") ? { label: "Services", href: "/services" } : null,
    // Unlaunched products stay out of the header until they are switched on in Admin → Site settings → Ecosystem pages.
    group("Products", list([live.profile ? page("profile") : null, live.cortexa ? page("cortexa-office") : null])),
    group("About", list([page("about", "About Ominet Digital"), page("founder", "The Founder"), page("omini-nfawa", "Omini Nfawa, author"), { href: "/contact", label: "Contact" }])),
  ];
  return [
    ...items.filter((i): i is NavItem => i !== null),
    ...p.custom.filter((c) => c.enabled).map((c) => ({ label: c.label, href: c.href, external: c.href.startsWith("https://") })),
  ];
}
