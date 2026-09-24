import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { articles } from "@/lib/content";

export const metadata = { title: "Writing — Ominet Digital" };

export default function WritingPage() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="480" height="480" viewBox="0 0 480 480" style={css("position:absolute;right:-140px;top:20px;pointer-events:none;")} aria-hidden="true">
        <circle cx="240" cy="240" r="239" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.16" />
        <circle cx="240" cy="240" r="160" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.12" />
      </svg>
      <svg width="140" height="500" style={css("position:absolute;left:var(--space-6);top:60px;pointer-events:none;")} aria-hidden="true">
        <line x1="8" y1="0" x2="8" y2="500" stroke="var(--color-text)" strokeWidth="1" opacity="0.07" />
        <line x1="40" y1="0" x2="40" y2="500" stroke="var(--color-text)" strokeWidth="1" opacity="0.07" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ARCHIVE</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Writing</h1>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-4);")}>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
          <span className="tag tag-accent">All</span>
          <span className="tag tag-outline">Articles</span>
          <span className="tag tag-outline">Essays</span>
          <span className="tag tag-outline">Research</span>
          <span className="tag tag-outline">Fiction</span>
          <span className="tag tag-outline">Poetry</span>
          <span className="tag tag-outline">Reviews</span>
          <span className="tag tag-outline">Interviews</span>
        </div>
        <div style={css("font-size:13px;opacity:0.6;display:flex;gap:var(--space-2);align-items:center;")}>
          <span>Sort:</span>
          <a href="#" style={css("opacity:1;")}>Newest</a>
          <span>&middot;</span>
          <a href="#">Featured</a>
          <span>&middot;</span>
          <a href="#">A&ndash;Z</a>
        </div>
      </section>

      <div className="hr" />

      {articles.map((a) => (
        <div key={a.slug}>
          <Link href={`/writing/${a.slug}`} style={css("display:block;")}>
            <section style={css("padding:var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-4);align-items:baseline;")}>
              <div style={css("font-size:12px;opacity:0.5;")}>{a.date}</div>
              <div>
                <div style={css("display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2);")}>
                  <span className="tag tag-neutral">{a.category}</span>
                  <span className={a.access === "paid" ? "tag tag-accent" : "tag tag-outline"}>{a.access === "paid" ? "PAID" : "FREE"}</span>
                </div>
                <div style={css("font-family:var(--font-heading);font-size:26px;margin-bottom:var(--space-1);")}>{a.title}</div>
                <p style={css("font-size:14px;opacity:0.7;margin:0;max-width:70ch;")}>{a.excerpt}</p>
              </div>
              <div style={css("font-size:12px;opacity:0.5;text-align:right;")}>{a.readTime}</div>
            </section>
          </Link>
          <div className="hr" />
        </div>
      ))}

      <Footer />
    </div>
  );
}
