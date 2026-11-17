"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, isNavActive } from "@/lib/admin/nav";
import QuickAddMenu from "@/components/admin/QuickAddMenu";

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export type NavBadges = { comments: number; bookings: number; reviews: number };

/**
 * The Admin Centre's layout shell: a sidebar on desktop, an off-canvas drawer
 * on mobile (<= 900px). This is presentation only — every link is an existing
 * route, and the sign-in check / redirect stays in the server layout.
 */
export default function AdminShell({
  userEmail,
  badges,
  footer,
  children,
  logoUrl,
}: {
  userEmail?: string | null;
  badges: NavBadges;
  footer: ReactNode;
  children: ReactNode;
  logoUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`admin-shell${open ? " drawer-open" : ""}`}>
      <div className="admin-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <Image src={logoUrl || "/images/ominet-digital-logo.svg"} alt="" width={22} height={21} style={{ display: "block", height: 21, width: "auto" }} />
          OMINI NFAWA
        </div>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <QuickAddMenu />
        </div>
        <nav className="admin-nav-scroll">
          {NAV_GROUPS.map((group, i) => (
            <div className="admin-nav-group" key={group.label || i}>
              {group.label && <div className="admin-nav-group-label">{group.label}</div>}
              {group.items.map((item) => {
                const active = isNavActive(item.href, pathname);
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <Link key={item.href} href={item.href} className="admin-nav-link" aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                    {item.label}
                    {badge > 0 && <span className="admin-nav-badge">{badge > 99 ? "99+" : badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ fontSize: 12, opacity: 0.6, wordBreak: "break-all", margin: "var(--space-3) 0 var(--space-2)" }}>{userEmail}</div>
        {footer}
      </aside>

      <div className="admin-main-col">
        <div className="admin-topbar">
          <button type="button" className="admin-hamburger" aria-label="Open menu" onClick={() => setOpen(true)}>
            <HamburgerIcon />
          </button>
          <span className="admin-topbar-title">OMINET DIGITAL</span>
          <QuickAddMenu compact />
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
