import type { CSSProperties } from "react";
import { cardArtPath, kindFromLabel, type ArtKind } from "@/lib/card-art";

/**
 * Branded SVG artwork shown wherever an item has no uploaded image. The file
 * name is kept for the many call sites; it now renders the Ominet card art
 * (public/art) instead of a dashed grey box. Pass `kind`/`slug` for a
 * specific illustration, or `portrait` inside A5-shaped boxes.
 */
export default function PlaceholderImage({
  label,
  kind,
  slug,
  title,
  portrait,
  className,
  style,
}: {
  label?: string;
  kind?: ArtKind;
  slug?: string;
  title?: string;
  portrait?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const src = cardArtPath(kind ?? kindFromLabel(label), { slug, title, portrait });
  return (
    // Static SVG from /public — nothing to optimise, so a plain <img> is correct here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      style={{ width: "100%", height: "100%", display: "block", objectFit: portrait ? "cover" : "contain", background: "var(--om-ivory)", ...style }}
    />
  );
}
