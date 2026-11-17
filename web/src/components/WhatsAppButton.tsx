"use client";

import { WhatsAppIcon } from "@/components/icons/SocialIcons";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

/**
 * A WhatsApp contact link, wherever it's placed (homepage, footer). Renders
 * nothing until Admin → Site settings → Contact → WhatsApp number is filled
 * in — so it simply doesn't exist yet if WhatsApp Business isn't set up,
 * and starts working everywhere it's used the moment that number is added,
 * no further wiring needed.
 */
export default function WhatsAppButton({
  color = "#f1eefb",
  size = 16,
  label,
  message = "Hi, I'd like to get in touch.",
}: {
  color?: string;
  size?: number;
  /** When set, renders as a labelled link (icon + text) instead of an icon-only one. */
  label?: string;
  message?: string;
}) {
  const { whatsapp } = useSiteSettings();
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/[^\d]/g, "");
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  if (label) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
        <WhatsAppIcon size={size} />
        {label}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" style={{ color, display: "inline-flex", textDecoration: "none" }}>
      <WhatsAppIcon size={size} />
    </a>
  );
}
