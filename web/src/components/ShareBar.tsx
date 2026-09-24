"use client";

import { useState } from "react";
import { css } from "@/lib/css";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to nothing
        return;
      }
    }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to fall back to
    }
  }

  return (
    <div style={css("display:flex;gap:var(--space-2);align-items:center;padding:var(--space-4) 0;border-top:2px solid var(--color-divider);border-bottom:2px solid var(--color-divider);margin-bottom:var(--space-6);")}>
      <span style={css("font-size:12px;opacity:0.6;margin-right:var(--space-2);")}>SHARE</span>
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Share on X" onClick={share}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.4 22H16.9l-5.1-6.7L6 22H2.9l8.1-9.3L1.6 2h6.6l4.6 6.1L18.9 2Z" /></svg>
      </button>
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Copy link" onClick={copyLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      </button>
      {copied && <span style={css("font-size:12px;opacity:0.6;")}>Copied!</span>}
    </div>
  );
}
