"use client";

import { CONSENT_OPEN_EVENT, GA_ID } from "@/lib/consent";

/** Footer link that reopens the cookie preferences panel. Rendered only when Google Analytics is configured. */
export default function CookieSettingsLink() {
  if (!GA_ID) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
    >
      Cookie settings
    </button>
  );
}
