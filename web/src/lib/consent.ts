// Visitor cookie-consent choice, kept in the visitor's own browser. Nothing here is sent to a server.
// The choice is versioned so a future change of purposes can ask again.

export const CONSENT_KEY = "omd-consent";
/** Fired on window whenever the saved choice changes. */
export const CONSENT_EVENT = "omd-consent-change";
/** Fired on window to open the preferences panel (for the footer "Cookie settings" link). */
export const CONSENT_OPEN_EVENT = "omd-consent-open";
/** Fired on window for analytics events that may be forwarded to Google Analytics (detail: { name }). */
export const GA_EVENT = "omd-ga-event";

/** Only these first-party events are mirrored to Google Analytics. */
export const GA_FORWARDED_EVENTS = new Set([
  "download",
  "outbound_click",
  "share",
  "enquiry_submitted",
  "booking_submitted",
  "newsletter_signup",
  "contact_click",
]);

/**
 * The only extra details that may go with a forwarded event. They are fixed labels or public slugs
 * (a link kind, a platform, a book or service slug), never anything a visitor typed.
 */
export const GA_SAFE_PARAMS = ["kind", "platform", "book_slug", "service_slug"] as const;

const RAW_GA_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
/** The GA4 measurement ID, or "" when none is set or the value is not shaped like one. Google Analytics stays off without it. */
export const GA_ID = /^G-[A-Z0-9]{6,14}$/.test(RAW_GA_ID) ? RAW_GA_ID : "";

export type ConsentState = { v: 1; analytics: boolean; at: string };

// Used when the browser blocks storage, so the choice still holds for the current visit.
let memoryRaw = "";

/** The saved choice exactly as stored, or "" when there is none. */
export function readRawConsent(): string {
  try {
    return window.localStorage.getItem(CONSENT_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

export function parseConsent(raw: string): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.v !== 1 || typeof parsed.analytics !== "boolean") return null;
    return { v: 1, analytics: parsed.analytics, at: typeof parsed.at === "string" ? parsed.at : "" };
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean): ConsentState {
  const state: ConsentState = { v: 1, analytics, at: new Date().toISOString() };
  memoryRaw = JSON.stringify(state);
  try {
    window.localStorage.setItem(CONSENT_KEY, memoryRaw);
  } catch {
    // Storage blocked: the in-memory copy above still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

/** Lets React subscribe to changes of the saved choice, including from another tab. */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
