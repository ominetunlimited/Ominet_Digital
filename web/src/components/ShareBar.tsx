"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { FacebookIcon, XIcon, LinkedInIcon, WhatsAppIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { track } from "@/lib/analytics/track-client";
import { buildShareText } from "@/lib/share-text";

function popup(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
}

/**
 * `url` is the full page address. `shortUrl` (our own /s/<code> address) is used wherever the link is
 * shown as text: WhatsApp, X, Threads and the copied link. Facebook and LinkedIn read the page itself
 * to build their preview card, so they get the full address.
 */
export default function ShareBar({ url, title, shortUrl, excerpt }: { url: string; title: string; shortUrl?: string | null; excerpt?: string | null }) {
  const link = shortUrl || url;
  // Title, a short excerpt and "Read more: <link>", trimmed to what each platform allows.
  const text = (platform: Parameters<typeof buildShareText>[0], withLink = true) => buildShareText(platform, { title, excerpt, link }, { withLink });
  const [copied, setCopied] = useState<string | null>(null);
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  async function nativeShare() {
    try {
      await navigator.share({ title, text: buildShareText("whatsapp", { title, excerpt, link }, { withLink: false }).replace(/\n\nRead more:$/, ""), url: link });
      track("share", { platform: "native" });
    } catch {
      // user cancelled — nothing to fall back to
    }
  }

  // Instagram and TikTok have no web address that pre-fills a post with a link, so the honest option
  // is to copy the short link and say where to paste it.
  async function copyLink(platform = "copy_link", note = "Link copied", content = link) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(note);
      track("share", { platform });
      setTimeout(() => setCopied(null), 4000);
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
        onClick={() => { track("share", { platform: "x" }); popup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text("x", false))}&url=${encodeURIComponent(link)}`); }}
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
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Share on WhatsApp"
        onClick={() => { track("share", { platform: "whatsapp" }); popup(`https://wa.me/?text=${encodeURIComponent(text("whatsapp"))}`); }}
      >
        <WhatsAppIcon size={14} />
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        style={css("font-size:12px;padding:4px 10px;min-height:32px;")}
        aria-label="Share on Threads"
        onClick={() => { track("share", { platform: "threads" }); popup(`https://www.threads.net/intent/post?text=${encodeURIComponent(text("threads"))}`); }}
      >
        Threads
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Copy caption for Instagram"
        onClick={() => copyLink("instagram", "Caption and link copied. Paste it into your Instagram caption or message. For a story, use the link sticker.", text("caption"))}
      >
        <InstagramIcon size={14} />
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        style={css("font-size:12px;padding:4px 10px;min-height:32px;")}
        aria-label="Copy caption for TikTok"
        onClick={() => copyLink("tiktok", "Caption and link copied. Paste it into your TikTok video description.", text("caption"))}
      >
        TikTok
      </button>
      {canNativeShare && (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="More sharing options" onClick={nativeShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          </svg>
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-icon" aria-label="Copy link" onClick={() => copyLink()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      </button>
      {copied && <span role="status" style={css("font-size:12px;opacity:0.7;")}>{copied}</span>}
    </div>
  );
}
