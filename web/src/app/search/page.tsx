"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

export default function SearchPage() {
  const [query, setQuery] = useState("publishing");
  const q = query.trim();
  const hasQuery = q.length > 0 && q.toLowerCase() !== "nomatch";
  const noResults = q.toLowerCase() === "nomatch" || q.length === 0;

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="240" height="150" viewBox="0 0 240 150" style={css("position:absolute;right:0;top:0;pointer-events:none;")} aria-hidden="true">
        <g stroke="var(--color-accent)" strokeWidth="1" opacity="0.12">
          <line x1="0" y1="35" x2="240" y2="35" /><line x1="0" y1="75" x2="240" y2="75" /><line x1="0" y1="115" x2="240" y2="115" />
          <line x1="60" y1="0" x2="60" y2="150" /><line x1="120" y1="0" x2="120" y2="150" /><line x1="180" y1="0" x2="180" y2="150" />
        </g>
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-4);")}>
        <div style={css("display:flex;gap:var(--space-3);max-width:640px;")}>
          <input
            type="search"
            className="input"
            placeholder="Search articles, books, media…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={css("flex:1;font-size:18px;")}
          />
        </div>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-4);")}>
          <span className="tag tag-accent">All</span>
          <span className="tag tag-outline">Writing</span>
          <span className="tag tag-outline">Books</span>
          <span className="tag tag-outline">Media</span>
          <span className="tag tag-outline">PROFILE</span>
          <span className="tag tag-outline">Ominet Digital</span>
        </div>
      </section>

      <div className="hr" />

      {hasQuery && (
        <section style={css("padding:var(--space-6);")}>
          <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-4);")}>3 results for &ldquo;{query}&rdquo;</div>
          <div style={css("display:grid;gap:var(--space-4);")}>
            <a href="/writing/on-writing-as-a-second-country" style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;")}>
              <span className="tag tag-neutral" style={css("flex-shrink:0;")}>ESSAY</span>
              <div><div style={css("font-family:var(--font-heading);font-size:18px;")}>On Writing as a Second Country</div><div style={css("font-size:13px;opacity:0.6;")}>Sept 12, 2026</div></div>
            </a>
            <a href="/books/the-long-return" style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;")}>
              <span className="tag tag-neutral" style={css("flex-shrink:0;")}>BOOK</span>
              <div><div style={css("font-family:var(--font-heading);font-size:18px;")}>The Long Return</div><div style={css("font-size:13px;opacity:0.6;")}>Novel &middot; 2026</div></div>
            </a>
            <a href="#" style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;")}>
              <span className="tag tag-neutral" style={css("flex-shrink:0;")}>VIDEO</span>
              <div><div style={css("font-family:var(--font-heading);font-size:18px;")}>The Long Return &mdash; Trailer</div><div style={css("font-size:13px;opacity:0.6;")}>6 min</div></div>
            </a>
          </div>
        </section>
      )}
      {noResults && (
        <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
          <div style={css("font-family:var(--font-heading);font-size:22px;margin-bottom:var(--space-2);")}>No results for &ldquo;{query}&rdquo;</div>
          <p style={css("font-size:14px;opacity:0.6;")}>Try a different word, or browse Writing and Books directly.</p>
        </section>
      )}

      <div className="hr" />
      <Footer />
    </div>
  );
}
