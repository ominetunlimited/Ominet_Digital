"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

/**
 * A book/article teaser capped to about two short paragraphs, with a "Read
 * more" toggle instead of a hard, un-recoverable cut. For previews that sit
 * inside another page — the homepage's Featured Book, an article's own
 * "Featured Book" card — not for a work's own page, which shows the full
 * text already. These previews are often the whole surface of a clickable
 * <Link> card, so the toggle stops that click from bubbling into it.
 */
export default function ReadMoreExcerpt({
  text,
  limit = 260,
  className,
  style,
}: {
  text: string;
  limit?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text.trim();
  const isLong = trimmed.length > limit;

  let shown = trimmed;
  if (isLong && !expanded) {
    const cut = trimmed.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    shown = `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }

  return (
    <div>
      <p className={className} style={style}>{shown}</p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{ background: "none", border: "none", padding: 0, font: "inherit", fontSize: 13, textDecoration: "underline", opacity: 0.75, cursor: "pointer" }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
