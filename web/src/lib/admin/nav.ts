// The Admin Centre's navigation, grouped the way a publishing CMS is
// (WordPress's own grouping as a reference for information architecture only —
// nothing here is copied visually). Only routes that already exist and are
// wired are listed; there is no entry for a feature that isn't built.

export type NavItem = { href: string; label: string; badgeKey?: "comments" | "bookings" | "reviews" };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: "", items: [{ href: "/admin", label: "Dashboard" }] },
  {
    label: "Publish",
    items: [
      { href: "/admin/content", label: "Content" },
      { href: "/admin/content/new?blog=1", label: "New blog article" },
      { href: "/admin/blog-categories", label: "Blog categories" },
      { href: "/admin/books", label: "Books" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/portfolio", label: "Work (portfolio)" },
      { href: "/admin/store", label: "Store" },
      { href: "/admin/media", label: "Media Library" },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/admin/comments", label: "Comments", badgeKey: "comments" },
      { href: "/admin/reviews", label: "Reviews", badgeKey: "reviews" },
      { href: "/admin/bookings", label: "Bookings", badgeKey: "bookings" },
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/documents", label: "Documents" },
      { href: "/admin/email-activity", label: "Email activity" },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/advertising", label: "Advertising" },
      { href: "/admin/social", label: "Social" },
      { href: "/admin/newsletter", label: "Newsletter" },
      { href: "/admin/research-profiles", label: "Research profiles" },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/pages", label: "Pages & tabs" },
      { href: "/admin/about-work", label: "About page" },
      { href: "/admin/ecosystem", label: "Ecosystem apps" },
      { href: "/admin/redirects", label: "Redirects" },
      { href: "/admin/settings", label: "Site settings" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/audit-log", label: "Audit log" },
    ],
  },
];

/** New-item shortcuts for the global "+ New" menu — every target already exists. */
export const QUICK_ADD: NavItem[] = [
  { href: "/admin/content/new", label: "Article" },
  { href: "/admin/books/new", label: "Book" },
  { href: "/admin/services/new", label: "Service" },
  { href: "/admin/store/new", label: "Product" },
  { href: "/admin/media", label: "Upload media" },
];

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
