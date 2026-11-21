"use client";

import { useMemo, useState } from "react";
import { css } from "@/lib/css";
import { recordSocialShare } from "@/lib/admin/social-actions";
import { SITE_URL } from "@/lib/seo";
import { FacebookIcon, XIcon, LinkedInIcon } from "@/components/icons/SocialIcons";

type ContentItem = { id: string; title: string; slug: string; excerpt: string | null };

const PLATFORMS = ["facebook", "x", "linkedin", "whatsapp", "telegram"] as const;
const PLATFORM_ICONS: Partial<Record<(typeof PLATFORMS)[number], typeof FacebookIcon>> = {
  facebook: FacebookIcon,
  x: XIcon,
  linkedin: LinkedInIcon,
};

function shareUrlFor(platform: string, url: string, caption: string) {
  const u = encodeURIComponent(url);
  const c = encodeURIComponent(caption);
  switch (platform) {
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "x": return `https://twitter.com/intent/tweet?text=${c}&url=${u}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "whatsapp": return `https://wa.me/?text=${c}%20${u}`;
    case "telegram": return `https://t.me/share/url?url=${u}&text=${c}`;
    default: return url;
  }
}

export default function SocialComposer({ items }: { items: ContentItem[] }) {
  const [contentId, setContentId] = useState(items[0]?.id ?? "");
  const item = useMemo(() => items.find((i) => i.id === contentId), [items, contentId]);
  const [caption, setCaption] = useState(item?.excerpt ?? item?.title ?? "");
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null);

  function selectItem(id: string) {
    setContentId(id);
    const next = items.find((i) => i.id === id);
    setCaption(next?.excerpt ?? next?.title ?? "");
  }

  if (items.length === 0) {
    return <p style={css("font-size:14px;opacity:0.6;")}>Publish something in Content first.</p>;
  }

  const url = item ? `${SITE_URL}/articles/${item.slug}` : "";

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Content</label>
        <select className="input" value={contentId} onChange={(e) => selectItem(e.target.value)}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Caption</label>
        <textarea className="input" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-6);")}>
        <label>Link</label>
        <input className="input" readOnly value={url} />
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SHARE (opens a pre-filled post on each platform — no account is directly connected yet)</div>
      <div style={css("display:grid;gap:var(--space-2);")}>
        {PLATFORMS.map((platform) => {
          const Icon = PLATFORM_ICONS[platform];
          return (
          <div key={platform} style={css("display:flex;gap:var(--space-2);align-items:center;")}>
            <span style={css("width:90px;display:flex;align-items:center;gap:var(--space-2);text-transform:capitalize;font-size:13px;")}>
              {Icon && <Icon size={14} />}
              {platform}
            </span>
            <a
              href={shareUrlFor(platform, url, caption)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              onClick={() => {
                if (item) recordSocialShare(item.id, platform, caption);
                setSavedPlatform(platform);
              }}
            >
              Open share window
            </a>
            {savedPlatform === platform && <span style={css("font-size:12px;opacity:0.6;")}>Logged</span>}
          </div>
          );
        })}
      </div>
    </div>
  );
}
