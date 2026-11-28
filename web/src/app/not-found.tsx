import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";

const SECTIONS = [
  { href: "/books", label: "Books", note: "Titles published by Ominet Digital" },
  { href: "/blog", label: "Blog", note: "Editorial posts and commentary" },
  { href: "/articles", label: "Articles and research", note: "Long-form writing" },
  { href: "/services", label: "Services", note: "Publishing, design, media and more" },
  { href: "/contact", label: "Contact", note: "Ask us, or discuss a project" },
];

export default function NotFound() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:clip;")}>
      <Nav />
      <svg width="280" height="280" viewBox="0 0 280 280" style={css("position:absolute;right:-90px;top:10px;pointer-events:none;")} aria-hidden="true">
        <circle cx="140" cy="140" r="139" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.16" />
      </svg>

      <main>
        <section style={css("padding:var(--space-8) var(--space-6) var(--space-5);text-align:center;")}>
          <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>404</div>
          <h1 style={css("font-family:var(--font-heading);font-size:48px;margin:0 0 var(--space-3);")}>This page doesn&rsquo;t exist.</h1>
          <p style={css("font-size:16px;line-height:1.6;opacity:0.7;max-width:56ch;margin:0 auto var(--space-5);")}>
            The address may have moved, been removed, or been typed slightly differently. Try a search, or pick a section below.
          </p>

          {/* A plain GET form: works without JavaScript and opens the search page with the words already filled in. */}
          <form action="/search" method="get" role="search" style={css("display:flex;gap:var(--space-2);justify-content:center;flex-wrap:wrap;margin:0 auto var(--space-4);max-width:520px;")}>
            <label htmlFor="not-found-search" style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>Search the site</label>
            <input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Search books, blog and articles"
              maxLength={200}
              style={css("flex:1 1 240px;min-width:0;padding:12px 14px;font-size:16px;border:1px solid var(--color-divider);border-radius:var(--radius-md);background:var(--color-bg);color:inherit;")}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          <Link href="/" className="btn btn-secondary">Back to home</Link>
        </section>

        <section aria-labelledby="not-found-sections" style={css("padding:var(--space-4) var(--space-6) var(--space-8);max-width:960px;margin:0 auto;")}>
          <h2 id="not-found-sections" style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.6;margin:0 0 var(--space-3);text-align:center;font-weight:400;")}>OR GO TO</h2>
          <ul style={css("list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-3);")}>
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  style={css("display:block;padding:var(--space-3) var(--space-4);border:1px solid var(--color-divider);border-radius:var(--radius-md);text-decoration:none;color:inherit;min-height:44px;")}
                >
                  <strong style={css("display:block;font-size:16px;")}>{s.label}</strong>
                  <span style={css("display:block;font-size:13px;opacity:0.7;line-height:1.5;")}>{s.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className="hr" />
      <Footer />
    </div>
  );
}
