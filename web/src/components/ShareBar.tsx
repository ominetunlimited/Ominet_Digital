"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { FacebookIcon, XIcon, LinkedInIcon } from "@/components/icons/SocialIcons";
import { track } from "@/lib/analytics/track-client";

function popup(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
}

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
      track("share", { platform: "native" });
    } catch {
      // user cancelled — nothing to fall back to
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("share", { platform: "copy_link" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to fall back to
    }
  }

  return (
    <div style={css("display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap;padding:var(--space-4) 0;border-top:2px solid var(--color-divider);border-bottom:2px solid var(--color-divider);margin-bottom:var(--space-6);")}>
      <span style={css("font-size:12px;opacity:0.6;margin-right:var(--space-2);")}>SHARE</span>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Share on Facebook"
        onClick={() => { track("share", { platform: "facebook" }); popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); }}
      >
        <FacebookIcon size={14} />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Share on X"
        onClick={() => { track("share", { platform: "x" }); popup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`); }}
      >
        <XIcon size={14} />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Share on LinkedIn"
        onClick={() => { track("share", { platform: "linkedin" }); popup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`); }}
      >
        <LinkedInIcon size={14} />
      </button>
      {canNativeShare && (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="More sharing options" onClick={nativeShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          </svg>
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Copy link" onClick={copyLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      </button>
      {copied && <span style={css("font-size:12px;opacity:0.6;")}>Copied!</span>}
    </div>
  );
}
