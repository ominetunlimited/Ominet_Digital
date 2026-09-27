"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

/**
 * A teaser of writing (a book excerpt, an article excerpt) capped to about
 * two paragraphs, with a "Read more" toggle instead of a hard, un-recoverable
 * cut. Paragraphs are split on a blank line — the same convention used for
 * an article's own body — and each renders as its own <p>, so multi-
 * paragraph text stays legible rather than running together. A single long
 * paragraph (most excerpt fields are just one) falls back to a character
 * clamp at a word boundary. These previews often sit inside a whole-card
 * <Link>, so the toggle stops that click from bubbling into it.
 */
export default function ReadMoreExcerpt({
  text,
  maxParagraphs = 2,
  charLimit = 320,
  className,
  style,
}: {
  text: string;
  maxParagraphs?: number;
  charLimit?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = text.trim().split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const toggle = (
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
  );

  if (paragraphs.length > maxParagraphs) {
    const shown = expanded ? paragraphs : paragraphs.slice(0, maxParagraphs);
    return (
      <div>
        {shown.map((p, i) => <p key={i} className={className} style={style}>{p}</p>)}
        {toggle}
      </div>
    );
  }

  const joined = paragraphs.join(" ");
  const isLong = joined.length > charLimit;
  let shownText = joined;
  if (isLong && !expanded) {
    const cut = joined.slice(0, charLimit);
    const lastSpace = cut.lastIndexOf(" ");
    shownText = `${(lastSpace > charLimit * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }

  return (
    <div>
      <p className={className} style={style}>{shownText}</p>
      {isLong && toggle}
    </div>
  );
}
