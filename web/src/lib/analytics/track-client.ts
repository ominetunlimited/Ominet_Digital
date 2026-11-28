"use client";

import { GA_EVENT } from "@/lib/consent";

// Fire-and-forget event capture from the browser. Never awaited, never
// allowed to throw into the caller — a failed analytics beacon must not
// break the click/share/purchase-link action it's attached to.
export function track(eventType: string, metadata?: Record<string, unknown>) {
  try {
    // Lets the consent manager mirror a few events to Google Analytics if the visitor accepted it.
    // It decides which events and which details are allowed through; see GA_FORWARDED_EVENTS and GA_SAFE_PARAMS.
    window.dispatchEvent(new CustomEvent(GA_EVENT, { detail: { name: eventType, params: metadata } }));
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventType,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        metadata,
      }),
    }).catch(() => {});
  } catch {
    // navigator/fetch unavailable — nothing to do
  }
}
