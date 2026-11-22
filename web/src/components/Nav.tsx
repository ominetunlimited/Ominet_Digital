"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SocialLinks from "@/components/SocialLinks";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { groupedNav, structuredNav } from "@/lib/nav-links";
import { isPageOn } from "@/lib/site-pages";

const LOGO = "/images/ominet-digital-logo.svg";

function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1, letterSpacing: "0.22em" }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: size, color: "#fff" }}>OMINET</span>
      <span style={{ fontSize: size * 0.42, letterSpacing: "0.5em", marginTop: 4, color: "#c9c2e6" }}>DIGITAL</span>
    </span>
  );
}

export default function Nav() {
  const { logoUrl, pages } = useSiteSettings();
  const items = structuredNav(pages);
  const groups = groupedNav(pages);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
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
      if (e.key === "Escape") { setMenuOpen(false); setOpenGroup(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close an open dropdown when the visitor clicks elsewhere.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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

  const isActive = (match: string) => match !== "/" && (pathname === match || pathname.startsWith(match + "/"));

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
        .omd-links a{white-space:nowrap;color:#f1eefb;text-decoration:none;font-size:13px;letter-spacing:0.06em;}
        .omd-links a[aria-current=page]{color:var(--om-cyan);box-shadow:inset 0 -2px 0 var(--om-cyan);padding-bottom:4px;}
        .omd-links a.btn-primary,.omd-mobile-menu a.btn-primary{color:var(--om-indigo);}
        .omd-links a:hover{color:var(--om-cyan);}
        .omd-group{position:relative;}
        .omd-group > button{background:none;border:none;color:#f1eefb;font:inherit;font-size:13px;letter-spacing:0.06em;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:10px 0;}
        .omd-group > button:hover,.omd-group > button:focus-visible,.omd-group > button[data-active=true]{color:var(--om-cyan);}
        .omd-group > button[data-active=true]{box-shadow:inset 0 -2px 0 var(--om-cyan);}
        .omd-group-panel{position:absolute;top:100%;left:-12px;min-width:230px;background:var(--om-navy);border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-md);padding:8px;display:grid;gap:2px;z-index:60;box-shadow:0 12px 30px rgba(0,0,0,0.35);}
        .omd-group-panel a{padding:10px 12px;border-radius:6px;font-size:13px;white-space:normal;}
        .omd-group-panel a:hover,.omd-group-panel a:focus-visible{background:rgba(255,255,255,0.08);}
        .omd-toggle{display:none;background:none;border:none;cursor:pointer;color:#f1eefb;padding:var(--space-2);min-width:44px;min-height:44px;align-items:center;justify-content:center;}
        @media (max-width: 980px){
          .omd-links{display:none;}
          .omd-toggle{display:flex;}
        }
        /* The mobile overlay is always navy chrome (independent of light/dark
           theme, like the desktop bar) — its links/buttons need color set
           explicitly rather than inherited, since the global a{} and .btn{}
           rules key off --color-text, which flips with the theme and would
           otherwise render dark-on-dark here. */
        .omd-mobile-menu a{color:#f1eefb;text-decoration:none;}
        .omd-mobile-menu a:hover,.omd-mobile-menu a:focus-visible{color:var(--om-cyan);}
        .omd-mobile-menu .btn-secondary{color:#f1eefb;border-color:rgba(255,255,255,0.35);}
        .omd-mobile-menu .btn-secondary:hover{background:rgba(255,255,255,0.08);}
        .omd-mobile-menu .hr{background:rgba(255,255,255,0.15);}
      `}</style>
      <nav className="nav" style={{ padding: "0 var(--space-6)", borderBottom: "none", position: "relative", background: "var(--om-navy)", color: "#f1eefb" }}>
        <Link href="/" className="nav-brand" aria-label="Ominet Digital, home" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
          <Image src={logoUrl || LOGO} alt="" width={36} height={35} priority style={{ display: "block", height: 35, width: "auto" }} />
          <Wordmark />
        </Link>
        <div className="omd-links" ref={navRef}>
          {items.map((it) => it.children ? (
            <div key={it.label} className="omd-group" onMouseEnter={() => setOpenGroup(it.label)} onMouseLeave={() => setOpenGroup((g) => (g === it.label ? null : g))}>
              <button type="button" aria-expanded={openGroup === it.label} aria-haspopup="true" data-active={it.children.some((c) => isActive(c.href))} onClick={(e) => setOpenGroup((g) => (e.detail === 0 && g === it.label ? null : it.label))}>
                {it.label.toUpperCase()}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {openGroup === it.label && (
                <div className="omd-group-panel">
                  {it.children.map((c) => (
                    <Link key={c.href + c.label} href={c.href} aria-current={isActive(c.href) ? "page" : undefined} onClick={() => setOpenGroup(null)}>{c.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={(it.href ?? "") + it.label} href={it.href ?? "/"} aria-current={it.href && isActive(it.href) ? "page" : undefined} {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {it.label.toUpperCase()}
            </Link>
          ))}          {isPageOn(pages, "search") && <button type="button" className="btn btn-ghost btn-icon" aria-label="Search" onClick={() => router.push("/search")} style={{ color: "#f1eefb" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>}
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Toggle dark mode" onClick={toggleTheme} style={{ color: "#f1eefb" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          </button>
          <Link href="/discuss-a-project" className="btn btn-primary">DISCUSS A PROJECT</Link>
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
          style={{ position: "fixed", inset: 0, background: "var(--om-navy)", color: "#f1eefb", zIndex: 1000, padding: "var(--space-6)", paddingTop: "max(var(--space-6), env(safe-area-inset-top))", paddingBottom: "max(var(--space-6), env(safe-area-inset-bottom))", overflowY: "auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image src={logoUrl || LOGO} alt="" width={34} height={33} style={{ display: "block", height: 33, width: "auto" }} />
              <Wordmark size={18} />
            </span>
            <button ref={closeButtonRef} type="button" className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)} style={{ color: "#f1eefb" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div style={{ display: "grid", gap: "var(--space-6)", fontSize: 22, fontFamily: "var(--font-heading)" }}>
            {[
              ["", [{ href: "/", label: "Home" }, ...items.filter((i) => !i.children && i.href).map((i) => ({ href: i.href as string, label: i.label, external: i.external }))]],
              ...items.filter((i) => i.children).map((i) => [i.label.toUpperCase(), i.children] as const),
              ["MORE", [...groups.utility]],
            ].map(([title, list0]) => {
              const list = list0 as { href: string; label: string; external?: boolean }[];
              if (list.length === 0) return null;
              return (
                <div key={title as string}>
                  {title && <div style={{ fontSize: 11, fontFamily: "var(--font-body)", letterSpacing: "0.1em", opacity: 0.5, marginBottom: "var(--space-2)" }}>{title as string}</div>}
                  <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {list.map((l) => (
                      <Link key={l.href + l.label} href={l.href} onClick={() => setMenuOpen(false)} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{l.label}</Link>
                    ))}
                  </div>
                  <div className="hr" style={{ marginTop: "var(--space-6)" }} />
                </div>
              );
            })}
            
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", fontSize: 14, fontFamily: "var(--font-body)" }}>
              <Link href="/discuss-a-project" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Discuss a project</Link>
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
