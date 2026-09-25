import Link from "next/link";
import { css } from "@/lib/css";

/**
 * One of the four ecosystem destinations (Omini Nfawa, PROFILE, Media,
 * Cortexa Office). All four render through this one component so they stay
 * siblings — same container, padding, border, radius and CTA treatment —
 * regardless of how much copy each one has. Only content should vary.
 */
export default function EcosystemItem({
  kicker,
  title,
  description,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      style={css(
        "border:2px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-2);background:var(--color-surface);box-shadow:var(--shadow-sm);height:100%;box-sizing:border-box;"
      )}
    >
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;")}>{kicker}</div>
      <div style={css("font-family:var(--font-heading);font-size:22px;line-height:1.15;")}>{title}</div>
      <p style={css("font-size:14px;opacity:0.7;margin:0;flex:1;")}>{description}</p>
      <span style={css("text-decoration:underline;font-size:14px;")}>{cta} &rarr;</span>
    </Link>
  );
}
