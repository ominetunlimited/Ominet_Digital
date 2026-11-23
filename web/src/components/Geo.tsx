import type { CSSProperties } from "react";

/**
 * Decorative geometry for the site: thin-line drawings in the brand colours.
 * Purely visual (aria-hidden), no images to load, and they inherit colour from `color`.
 */
type Variant = "lattice" | "orbit" | "facets" | "grid";

export default function Geo({ variant = "lattice", size = 240, color = "var(--om-cyan)", opacity = 0.35, style }: { variant?: Variant; size?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true" focusable="false" style={{ position: "absolute", pointerEvents: "none", opacity, ...style }}>
      {variant === "lattice" && (
        <g {...common}>
          <rect x="20" y="20" width="200" height="200" />
          <rect x="20" y="20" width="200" height="200" transform="rotate(45 120 120)" />
          <circle cx="120" cy="120" r="100" />
          <circle cx="120" cy="120" r="60" />
          <path d="M20 120h200M120 20v200" />
          <circle cx="120" cy="120" r="6" fill={color} />
        </g>
      )}
      {variant === "orbit" && (
        <g {...common}>
          <circle cx="120" cy="120" r="108" />
          <circle cx="120" cy="120" r="78" strokeDasharray="3 7" />
          <circle cx="120" cy="120" r="48" />
          <ellipse cx="120" cy="120" rx="108" ry="40" transform="rotate(30 120 120)" />
          <ellipse cx="120" cy="120" rx="108" ry="40" transform="rotate(-30 120 120)" />
          <circle cx="228" cy="120" r="5" fill={color} />
          <circle cx="42" cy="68" r="4" fill={color} />
        </g>
      )}
      {variant === "facets" && (
        <g {...common}>
          <polygon points="120,12 228,75 228,165 120,228 12,165 12,75" />
          <polygon points="120,48 196,92 196,148 120,192 44,148 44,92" />
          <path d="M120 12v36M228 75l-32 17M228 165l-32-17M120 228v-36M12 165l32-17M12 75l32 17" />
          <path d="M44 92l76 44 76-44M120 136v56" />
        </g>
      )}
      {variant === "grid" && (
        <g {...common}>
          {Array.from({ length: 7 }, (_, i) => <path key={`h${i}`} d={`M20 ${20 + i * 33.3}h200`} />)}
          {Array.from({ length: 7 }, (_, i) => <path key={`v${i}`} d={`M${20 + i * 33.3} 20v200`} />)}
          <circle cx="120" cy="120" r="66.6" />
          <path d="M20 20l200 200M220 20L20 220" strokeDasharray="2 6" />
        </g>
      )}
    </svg>
  );
}
