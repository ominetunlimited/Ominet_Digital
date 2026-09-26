"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SocialLinks from "@/components/SocialLinks";

const LINKS: { href: string; label: string; match: string }[] = [
  { href: "/omini-nfawa", label: "OMINI NFAWA", match: "/omini-nfawa" },
  { href: "/writing", label: "WRITING", match: "/writing" },
  { href: "/books", label: "BOOKS", match: "/books" },
  { href: "/media", label: "MEDIA", match: "/media" },
  { href: "/profile", label: "PROFILE", match: "/profile" },
  { href: "/cortexa-office", label: "CORTEXA OFFICE", match: "/cortexa-office" },
  { href: "/about", label: "ABOUT", match: "/about" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  // Not rendered anywhere — only drives toggleTheme's direction — so lazily
  // reading it (rather than syncing via an effect) can't cause a hydration
  // mismatch. The layout's blocking script already set data-theme on <html>
  // before this component mounts.
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document === "undefined"
      ? "light"
      : (localStorage.getItem("omd-theme") as "light" | "dark" | null) || "light"
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Lock background scroll while the mobile overlay is open, and move
  // focus in/out of it so keyboard users land somewhere sensible.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const openButton = openButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      openButton?.focus();
    };
  }, [menuOpen]);

  const isActive = (match: string) => pathname === match || pathname.startsWith(match + "/");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("omd-theme", next);
    setTheme(next);
  };

  return (
    <>
      <style>{`
        .omd-links{display:flex;gap:var(--space-4);align-items:center;white-space:nowrap;}
        .omd-links a{white-space:nowrap;color:#eafaf0;text-decoration:none;}
        .omd-links a:hover{color:var(--om-orange);}
        .omd-toggle{display:none;background:none;border:none;cursor:pointer;color:#eafaf0;padding:var(--space-2);min-width:44px;min-height:44px;align-items:center;justify-content:center;}
        @media (max-width: 980px){
          .omd-links{display:none;}
          .omd-toggle{display:flex;}
        }
        /* The mobile overlay is always navy chrome (independent of light/dark
           theme, like the desktop bar) — its links/buttons need color set
           explicitly rather than inherited, since the global a{} and .btn{}
           rules key off --color-text, which flips with the theme and would
           otherwise render dark-on-dark here. */
        .omd-mobile-menu a{color:#eafaf0;text-decoration:none;}
        .omd-mobile-menu a:hover,.omd-mobile-menu a:focus-visible{color:var(--om-orange);}
        .omd-mobile-menu .btn-secondary{color:#eafaf0;border-color:rgba(255,255,255,0.35);}
        .omd-mobile-menu .btn-secondary:hover{background:rgba(255,255,255,0.08);}
        .omd-mobile-menu .hr{background:rgba(255,255,255,0.15);}
      `}</style>
      <nav className="nav" style={{ padding: "0 var(--space-6)", borderBottom: "none", position: "relative", background: "var(--om-navy)", color: "#eafaf0" }}>
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/images/ominet-digital-logo.svg" alt="Ominet Digital" width={30} height={23} priority style={{ display: "block" }} />
          <span>OMINET DIGITAL</span>
        </Link>
        <div className="omd-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.match) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Search" onClick={() => router.push("/search")} style={{ color: "#eafaf0" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Toggle dark mode" onClick={toggleTheme} style={{ color: "#eafaf0" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          </button>
          <button type="button" className="btn btn-primary">SUBSCRIBE</button>
        </div>
        <button
          ref={openButtonRef}
          type="button"
          className="omd-toggle"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{ marginLeft: "auto" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </nav>
      {menuOpen && (
        <div
          className="omd-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          style={{ position: "fixed", inset: 0, background: "var(--om-navy)", color: "#eafaf0", zIndex: 1000, padding: "var(--space-6)", paddingTop: "max(var(--space-6), env(safe-area-inset-top))", paddingBottom: "max(var(--space-6), env(safe-area-inset-bottom))", overflowY: "auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, letterSpacing: "0.02em", color: "#fff" }}>
              <Image src="/images/ominet-digital-logo.svg" alt="Ominet Digital" width={30} height={23} style={{ display: "block" }} />
              OMINET DIGITAL
            </span>
            <button ref={closeButtonRef} type="button" className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)} style={{ color: "#eafaf0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div style={{ display: "grid", gap: "var(--space-6)", fontSize: 22, fontFamily: "var(--font-heading)" }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-body)", letterSpacing: "0.1em", opacity: 0.5, marginBottom: "var(--space-2)" }}>CONTENT</div>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link href="/omini-nfawa" onClick={() => setMenuOpen(false)}>Omini Nfawa</Link>
                <Link href="/writing" onClick={() => setMenuOpen(false)}>Writing</Link>
                <Link href="/books" onClick={() => setMenuOpen(false)}>Books</Link>
                <Link href="/media" onClick={() => setMenuOpen(false)}>Media</Link>
              </div>
            </div>
            <div className="hr" />
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-body)", letterSpacing: "0.1em", opacity: 0.5, marginBottom: "var(--space-2)" }}>ECOSYSTEM</div>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                <Link href="/profile" onClick={() => setMenuOpen(false)}>PROFILE</Link>
                <Link href="/cortexa-office" onClick={() => setMenuOpen(false)}>Cortexa Office</Link>
                <Link href="/store" onClick={() => setMenuOpen(false)}>Store</Link>
              </div>
            </div>
            <div className="hr" />
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-body)", letterSpacing: "0.1em", opacity: 0.5, marginBottom: "var(--space-2)" }}>ABOUT</div>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
                <Link href="/search" onClick={() => setMenuOpen(false)}>Search</Link>
              </div>
            </div>
            <div className="hr" />
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", fontSize: 14, fontFamily: "var(--font-body)" }}>
              <button type="button" className="btn btn-primary">Subscribe</button>
              <button type="button" className="btn btn-secondary" onClick={toggleTheme}>Toggle dark mode</button>
            </div>
            <div style={{ opacity: 0.8 }}>
              <SocialLinks size={18} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
