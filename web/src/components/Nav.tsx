"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem("omd-theme") as "light" | "dark" | null) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        .omd-toggle{display:none;background:none;border:none;cursor:pointer;color:#eafaf0;padding:var(--space-2);}
        @media (max-width: 980px){
          .omd-links{display:none;}
          .omd-toggle{display:flex;}
        }
      `}</style>
      <nav className="nav" style={{ padding: "0 var(--space-6)", borderBottom: "none", position: "relative", background: "var(--om-navy)", color: "#eafaf0" }}>
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, letterSpacing: "0.02em" }}>
          OMINET DIGITAL
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
        <div style={{ position: "fixed", inset: 0, background: "var(--om-navy)", color: "#eafaf0", zIndex: 1000, padding: "var(--space-6)", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-8)" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.02em", color: "#fff" }}>OMINET DIGITAL</span>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)} style={{ color: "#eafaf0" }}>
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
            <div style={{ display: "flex", gap: "var(--space-4)", fontSize: 13, fontFamily: "var(--font-body)", opacity: 0.6 }}>
              <span>Facebook</span><span>X</span><span>LinkedIn</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
