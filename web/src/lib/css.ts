import type { CSSProperties } from "react";

/**
 * Parses a CSS declaration string (as used throughout the approved .dc.html
 * design files) into a React style object. Keeps inline styles copy-pasteable
 * from the design source instead of hand-transcribed into object literals,
 * which is what keeps every page pixel-faithful to the design lock.
 */
export function css(declarations: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of declarations.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    const key = prop.startsWith("--")
      ? prop
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = value;
  }
  return out as CSSProperties;
}
