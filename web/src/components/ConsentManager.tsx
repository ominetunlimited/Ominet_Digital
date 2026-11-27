"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_OPEN_EVENT, GA_EVENT, GA_FORWARDED_EVENTS, GA_ID, parseConsent, readRawConsent, saveConsent, subscribeConsent } from "@/lib/consent";
import { disableGa, gaEvent, loadGa } from "@/lib/ga";

const ADS_ON = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

/**
 * Cookie consent for non-essential analytics. Mounted once in the root layout.
 * Renders nothing, and loads nothing from Google, unless a GA4 measurement ID is configured.
 * Google Analytics is downloaded only after the visitor accepts it, and stops when they withdraw.
 */
export default function ConsentManager() {
  const pathname = usePathname();
  // The saved choice lives in the visitor's browser. "__server__" marks the server render and the first client render.
  const raw = useSyncExternalStore(subscribeConsent, readRawConsent, () => "__server__");
  const ready = raw !== "__server__";
  const consent = ready ? parseConsent(raw) : null;
  const decided = consent !== null;
  const analytics = consent?.analytics === true;
  const [panelOpen, setPanelOpen] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOn = useRef(false);

  // Load Google Analytics once analytics is accepted (new choice or returning visitor), and switch it off on withdrawal.
  useEffect(() => {
    if (!ready || !GA_ID) return;
    if (analytics) {
      loadGa(GA_ID);
      wasOn.current = true;
    } else if (wasOn.current) {
      disableGa(GA_ID);
      wasOn.current = false;
    }
  }, [ready, analytics]);

  // One page view per route, only while analytics is accepted. No personal data is attached.
  useEffect(() => {
    if (!ready || !analytics || !GA_ID) return;
    gaEvent("page_view", { page_path: pathname, page_location: `${window.location.origin}${pathname}` });
  }, [ready, analytics, pathname]);

  // Mirror a short list of first-party events (by name only) while analytics is accepted.
  useEffect(() => {
    if (!analytics || !GA_ID) return;
    const onEvent = (e: Event) => {
      const name = (e as CustomEvent<{ name: string }>).detail?.name;
      if (name && GA_FORWARDED_EVENTS.has(name)) gaEvent(name);
    };
    window.addEventListener(GA_EVENT, onEvent);
    return () => window.removeEventListener(GA_EVENT, onEvent);
  }, [analytics]);

  const openPanel = useCallback(() => {
    returnFocus.current = (document.activeElement as HTMLElement) || null;
    setAnalyticsChoice(parseConsent(readRawConsent())?.analytics === true);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    returnFocus.current?.focus?.();
  }, []);

  // The footer "Cookie settings" link opens the panel from anywhere.
  useEffect(() => {
    window.addEventListener(CONSENT_OPEN_EVENT, openPanel);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openPanel);
  }, [openPanel]);

  // Panel keyboard behaviour: focus moves in, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!panelOpen) return;
    const root = panelRef.current;
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>("button, a[href], input:not([disabled])") ?? []);
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closePanel(); return; }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, closePanel]);

  if (!GA_ID || !ready) return null;

  const choose = (value: boolean) => {
    saveConsent(value);
    setPanelOpen(false);
  };

  const box: React.CSSProperties = {
    background: "var(--color-bg)",
    color: "var(--color-text, inherit)",
    border: "1px solid var(--color-divider)",
    borderRadius: "var(--radius-md)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
  };

  return (
    <>
      {!decided && !panelOpen && (
        <div
          role="region"
          aria-label="Cookie consent"
          style={{ ...box, position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 1000, maxWidth: 720, margin: "0 auto", padding: "var(--space-4)" }}
        >
          <p style={{ margin: "0 0 var(--space-3)", fontSize: 14, lineHeight: 1.6 }}>
            We use essential cookies to make this site work. With your permission we also use Google Analytics to understand how the site is used. It is off unless you accept.{" "}
            <Link href="/cookies">Read the cookie notice</Link>.
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => choose(true)}>Accept all</button>
            <button type="button" className="btn btn-primary" onClick={() => choose(false)}>Reject non-essential</button>
            <button type="button" className="btn btn-secondary" onClick={openPanel}>Manage preferences</button>
          </div>
        </div>
      )}

      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", padding: 16 }}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            style={{ ...box, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: "var(--space-5)" }}
          >
            <h2 id="consent-title" style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "0 0 var(--space-3)" }}>Cookie preferences</h2>

            <div style={{ borderTop: "1px solid var(--color-divider)", padding: "var(--space-3) 0" }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <input type="checkbox" checked disabled style={{ marginTop: 4, width: 18, height: 18 }} />
                <span>
                  <strong>Essential</strong> (always on)
                  <span style={{ display: "block", fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>Sign-in, a random visitor key for likes, your theme choice, and our own privacy-friendly page counts. The site does not work properly without these.</span>
                </span>
              </label>
            </div>

            <div style={{ borderTop: "1px solid var(--color-divider)", padding: "var(--space-3) 0" }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <input type="checkbox" checked={analyticsChoice} onChange={(e) => setAnalyticsChoice(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18 }} />
                <span>
                  <strong>Analytics</strong> (Google Analytics)
                  <span style={{ display: "block", fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>Shows us which pages are read and which links are used. We never send names, email addresses or anything you type into a form.</span>
                </span>
              </label>
            </div>

            {ADS_ON && (
              <div style={{ borderTop: "1px solid var(--color-divider)", padding: "var(--space-3) 0", fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}>
                <strong>Advertising</strong>: this site currently loads Google AdSense, and the choice above does not control it yet. You can manage personalised ads in{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. See the <Link href="/cookies">cookie notice</Link>.
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
              <button type="button" className="btn btn-primary" onClick={() => choose(analyticsChoice)}>Save preferences</button>
              <button type="button" className="btn btn-secondary" onClick={() => choose(true)}>Accept all</button>
              <button type="button" className="btn btn-secondary" onClick={() => choose(false)}>Reject non-essential</button>
              {decided && <button type="button" className="btn btn-secondary" onClick={closePanel}>Close</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
