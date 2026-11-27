"use client";

// Google Analytics 4 loader. Nothing is downloaded from Google until loadGa() is called,
// and loadGa() is only called after the visitor has accepted analytics.

type Gtag = (...args: unknown[]) => void;
type GaWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;

const w = () => window as unknown as GaWindow;

export function loadGa(id: string) {
  if (!id || typeof window === "undefined") return;
  const win = w();
  win[`ga-disable-${id}`] = false;
  if (win.gtag) return; // already loaded

  win.dataLayer = win.dataLayer || [];
  win.gtag = function gtag() {
    // gtag.js expects the real `arguments` object, not an array.
    // eslint-disable-next-line prefer-rest-params
    (win.dataLayer as unknown[]).push(arguments);
  };
  win.gtag("js", new Date());
  win.gtag("config", id, {
    send_page_view: false, // page views are sent manually on every route change
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** Sends one event by name. Never include names, emails or form contents here. */
export function gaEvent(name: string, params?: Record<string, string>) {
  const win = w();
  if (win.gtag) win.gtag("event", name, params);
}

/** Stops measurement and removes Google Analytics cookies after a visitor withdraws consent. */
export function disableGa(id: string) {
  const win = w();
  win[`ga-disable-${id}`] = true;
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = new Set<string>([host, `.${host}`]);
  if (parts.length > 2) domains.add(`.${parts.slice(-3).join(".")}`);
  if (parts.length > 1) domains.add(`.${parts.slice(-2).join(".")}`);
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0].trim();
    if (!/^_ga(_|$)/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
