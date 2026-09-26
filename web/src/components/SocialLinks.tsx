"use client";

import { SOCIAL_ICONS } from "@/components/icons/SocialIcons";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

/**
 * The site's social profiles as icon links, taken from Admin → Site settings.
 * Takes an explicit `color` (rather than inheriting) because every current
 * placement sits on the permanently-navy chrome (Nav/hero/footer), and the
 * global a{} rule keys off --color-text — which flips with the theme and would
 * otherwise render invisible dark-on-dark there.
 */
export default function SocialLinks({
  color = "#eafaf0",
  size = 16,
  gap = "var(--space-3)",
}: {
  color?: string;
  size?: number;
  gap?: string;
}) {
  const { social } = useSiteSettings();
  const links = social.filter((s) => s.enabled && s.url);
  if (links.length === 0) return null;
  return (
    <div style={{ display: "flex", gap, alignItems: "center" }}>
      {links.map(({ platform, label, url }) => {
        const Icon = SOCIAL_ICONS[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            style={{ color, display: "inline-flex", textDecoration: "none" }}
          >
            <Icon size={size} />
          </a>
        );
      })}
    </div>
  );
}
