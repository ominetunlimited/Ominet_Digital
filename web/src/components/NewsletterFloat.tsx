"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NewsletterForm from "@/components/NewsletterForm";

const KEY = "omd-newsletter";
const HIDDEN_ON = ["/admin", "/unsubscribe", "/login", "/auth"];

/**
 * A small "Newsletter" tab at the bottom-left of every public page. It only appears after the visitor has scrolled a little
 * (so it never covers the hero), opens a compact signup panel on request, and never pops up on its own.
 * Once someone subscribes it disappears for good on that browser.
 */
export default function NewsletterFloat() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(KEY) === "subscribed"; } catch { return false; }
  });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, [open]);

  if (done || HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  if (!shown && !open) return null;

  return (
    <div ref={boxRef} className="omd-nl" style={{ position: "fixed", left: "max(12px, env(safe-area-inset-left))", bottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 45 }}>
      <style>{`
        .omd-nl button.omd-nl-tab{display:inline-flex;align-items:center;gap:8px;background:var(--om-navy);color:#f1eefb;border:1px solid rgba(127,214,238,0.5);border-radius:999px;padding:9px 14px;font:inherit;font-size:13px;font-weight:600;letter-spacing:0.04em;cursor:pointer;box-shadow:0 6px 18px rgba(8,10,40,0.3);}
        .omd-nl button.omd-nl-tab:hover,.omd-nl button.omd-nl-tab:focus-visible{border-color:var(--om-cyan);}
        .omd-nl-panel{width:min(320px,calc(100vw - 24px));background:var(--om-navy);color:#f1eefb;border:1px solid rgba(127,214,238,0.4);border-radius:14px;padding:16px;box-shadow:0 14px 34px rgba(8,10,40,0.4);}
        .omd-nl-panel .input{background:#fff;color:#16143d;}
        @media (max-width:520px){.omd-nl button.omd-nl-tab span.omd-nl-text{display:none;}.omd-nl button.omd-nl-tab{padding:11px;}}
      `}</style>
      {open ? (
        <div className="omd-nl-panel" role="dialog" aria-label="Newsletter signup">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1.25 }}>Join the newsletter</div>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>&times;</button>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85, margin: "6px 0 12px" }}>New books, posts and projects from Ominet Digital, now and then. Unsubscribe whenever you like.</p>
          <NewsletterForm onSuccess={() => { try { localStorage.setItem(KEY, "subscribed"); } catch { /* ignore */ } setTimeout(() => setDone(true), 3500); }} />
        </div>
      ) : (
        <button type="button" className="omd-nl-tab" onClick={() => setOpen(true)} aria-label="Open newsletter signup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          <span className="omd-nl-text">Newsletter</span>
        </button>
      )}
    </div>
  );
}
