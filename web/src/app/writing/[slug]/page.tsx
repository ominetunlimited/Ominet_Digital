import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { articles, getArticle } from "@/lib/content";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? `${article.title} — Ominet Digital` : "Article — Ominet Digital" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="300" height="300" viewBox="0 0 300 300" style={css("position:absolute;right:-70px;top:40px;pointer-events:none;")} aria-hidden="true">
        <circle cx="150" cy="150" r="149" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.16" />
      </svg>

      <article style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);")}>
        <div style={css("display:flex;gap:var(--space-3);align-items:center;font-size:12px;opacity:0.6;margin-bottom:var(--space-4);")}>
          <span className="tag tag-neutral">{article.category}</span>
          <span>{article.date}</span>
          <span>&middot;</span>
          <span>{article.readTime} read</span>
        </div>
        <h1 style={css("font-family:var(--font-heading);font-size:44px;line-height:1.1;margin:0 0 var(--space-3);")}>{article.title}</h1>
        {article.dek && <p style={css("font-size:19px;line-height:1.5;opacity:0.75;margin:0 0 var(--space-4);")}>{article.dek}</p>}
        <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-6);")}>By {article.author}</div>

        <div style={css("aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-6);")}>
          <PlaceholderImage label="Hero image" />
        </div>

        <div style={css("font-size:18px;line-height:1.8;")}>
          <p>There is a particular silence that arrives with a new language &mdash; not the absence of words, but the absence of the right ones. For years I mistook this silence for a failure of vocabulary. It was something else: a second country, arriving slowly, with its own weather.</p>
          <p>Every migrant writer knows this territory. The first language holds the childhood; the second language holds the adult who has to explain the childhood to people who were never there. Between them is a border that no passport describes.</p>
        </div>

        {article.access === "paid" && (
          <div style={css("margin:var(--space-8) 0;padding:var(--space-6);border:2px solid var(--color-divider);text-align:center;")}>
            <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-2);")}>This essay continues for paid readers.</div>
            <div style={css("font-family:var(--font-heading);font-size:24px;margin-bottom:var(--space-4);")}>{article.price}</div>
            <button type="button" className="btn btn-primary">Get full access</button>
            <div style={css("font-size:12px;opacity:0.5;margin-top:var(--space-3);")}>Already purchased? <a href="#" style={css("text-decoration:underline;")}>Restore access</a></div>
          </div>
        )}

        <div style={css("display:flex;gap:var(--space-2);align-items:center;padding:var(--space-4) 0;border-top:2px solid var(--color-divider);border-bottom:2px solid var(--color-divider);margin-bottom:var(--space-6);")}>
          <span style={css("font-size:12px;opacity:0.6;margin-right:var(--space-2);")}>SHARE</span>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Share on X"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.4 22H16.9l-5.1-6.7L6 22H2.9l8.1-9.3L1.6 2h6.6l4.6 6.1L18.9 2Z" /></svg></button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Copy link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></button>
        </div>

        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4);margin-bottom:var(--space-8);")}>
          <div className="card">
            <div className="card-kicker">RELATED BOOK</div>
            <div className="card-title">The Long Return</div>
            <p className="card-body">A novel on the same themes of border and return.</p>
          </div>
          <div className="card">
            <div className="card-kicker">MORE FROM OMINI</div>
            <div className="card-title">Notes on the Coastline</div>
            <p className="card-body">Field notes on erosion and memory along the delta.</p>
          </div>
        </div>
      </article>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
        <div style={css("flex:1 1 260px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>NEWSLETTER</div>
          <div style={css("font-family:var(--font-heading);font-size:24px;")}>New writing and book news, occasionally.</div>
        </div>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;flex:1 1 260px;")}>
          <input type="email" className="input" placeholder="you@email.com" style={css("min-width:200px;flex:1;")} />
          <button type="button" className="btn btn-primary">Subscribe</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
