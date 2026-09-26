import type { ReactNode } from "react";
import { adTag, isExternal } from "@/lib/ad-validate";

export type AdCardData = {
  kind: string;
  title: string;
  headline?: string;
  imageUrl?: string;
  imageAlt?: string;
  portrait: boolean;
  destinationUrl: string;
  ctaLabel?: string;
};

/**
 * The visual for one ad. Used on the public site (wrapped in tracking) and,
 * without a link, as the live preview in the admin. Always carries its
 * "Advertisement / Sponsored / Partner" label so it can't pass for editorial.
 */
export default function AdCard({ ad, interactive = true, onClick }: { ad: AdCardData; interactive?: boolean; onClick?: () => void }) {
  const external = isExternal(ad.destinationUrl);
  const body: ReactNode = (
    <>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", opacity: 0.55, marginBottom: 8 }}>{adTag(ad.kind)}</div>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexDirection: ad.portrait ? "row" : "column" }}>
        {ad.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt={ad.imageAlt || ad.title}
            loading="lazy"
            decoding="async"
            style={
              ad.portrait
                ? { width: 120, flexShrink: 0, aspectRatio: "1 / 1.414", objectFit: "cover", borderRadius: "var(--radius-sm)", display: "block" }
                : { width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: "var(--radius-sm)", display: "block" }
            }
          />
        )}
        {(ad.headline || ad.ctaLabel || !ad.imageUrl) && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, minWidth: 0 }}>
            {ad.headline && <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1.3, overflowWrap: "anywhere" }}>{ad.headline}</div>}
            <span className="btn btn-secondary" style={{ alignSelf: "flex-start", pointerEvents: "none" }}>
              {ad.ctaLabel || "Learn more"} &#8599;
            </span>
          </div>
        )}
      </div>
    </>
  );

  const box: React.CSSProperties = {
    display: "block",
    border: "1px solid var(--color-divider)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-4)",
    background: "var(--color-surface, transparent)",
    color: "inherit",
    textDecoration: "none",
    maxWidth: 720,
  };

  if (!interactive) return <div style={box}>{body}</div>;
  return (
    <a href={ad.destinationUrl} onClick={onClick} rel={external ? "sponsored noopener noreferrer" : undefined} target={external ? "_blank" : undefined} style={box}>
      {body}
    </a>
  );
}
