import type { CSSProperties } from "react";

/**
 * Stand-in for the design's <image-slot> drag-and-drop placeholder (a
 * design-tool-only element). Real photography is supplied later via the
 * Admin media library; until then every cover/photo slot renders this so
 * layout, aspect ratios and radii match the approved design exactly.
 */
export default function PlaceholderImage({
  label = "Image",
  className,
  style,
}: {
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        textAlign: "center",
        padding: 12,
        boxSizing: "border-box",
        color: "inherit",
        background: "color-mix(in srgb, currentColor 8%, transparent)",
        border: "1.5px dashed color-mix(in srgb, currentColor 35%, transparent)",
        ...style,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={0.45}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span style={{ fontSize: 11, opacity: 0.6, maxWidth: "90%" }}>{label}</span>
    </div>
  );
}
