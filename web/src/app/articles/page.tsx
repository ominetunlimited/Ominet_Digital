import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { getArticles } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { collectionPageSchema } from "@/lib/schema";
import type { Article } from "@/lib/content";
import ArticleCard from "@/components/cards/ArticleCard";

export const generateMetadata = () => pageMetadata(
  "Articles",
  "Long-form articles, essays, research, fiction and interviews from Ominet Digital.",
  "/articles"
);
export const revalidate = 60;

const CATEGORIES = [
  { label: "Articles", value: "ARTICLE" },
  { label: "Essays", value: "ESSAY" },
  { label: "Research", value: "RESEARCH" },
  { label: "Fiction", value: "FICTION" },
  { label: "Poetry", value: "POEM" },
  { label: "Reviews", value: "REVIEW" },
  { label: "Interviews", value: "INTERVIEW" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Featured", value: "featured" },
  { label: "A–Z", value: "az" },
];

function sortArticles(articles: Article[], sort: string): Article[] {
  if (sort === "featured") return [...articles].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  if (sort === "az") return [...articles].sort((a, b) => a.title.localeCompare(b.title));
  return articles; // "newest" — getArticles() already orders by published_at desc
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort = "newest" } = await searchParams;
  const allArticles = await getArticles();
  const articles = sortArticles(category ? allArticles.filter((a) => a.category === category) : allArticles, sort);
  const jsonLd = collectionPageSchema("Articles", "/articles", articles.map((a) => a.title));

  function withParams(next: { category?: string; sort?: string }) {
    const params = new URLSearchParams();
    const nextCategory = next.category !== undefined ? next.category : category;
    const nextSort = next.sort !== undefined ? next.sort : sort;
    if (nextCategory) params.set("category", nextCategory);
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    const qs = params.toString();
    return qs ? `/articles?${qs}` : "/articles";
  }

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:clip;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...jsonLd }) }} />
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
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Articles</h1>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-4) var(--space-6);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-4);")}>
        <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
          <Link href={withParams({ category: "" })} className={category ? "tag tag-outline" : "tag tag-accent"}>All</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={withParams({ category: category === c.value ? "" : c.value })}
              className={category === c.value ? "tag tag-accent" : "tag tag-outline"}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div style={css("font-size:13px;opacity:0.6;display:flex;gap:var(--space-2);align-items:center;")}>
          <span>Sort:</span>
          {SORTS.map((s, i) => (
            <span key={s.value} style={css("display:flex;gap:var(--space-2);align-items:center;")}>
              {i > 0 && <span>&middot;</span>}
              <Link href={withParams({ sort: s.value })} style={css(sort === s.value ? "opacity:1;font-weight:600;" : "opacity:0.7;")}>
                {s.label}
              </Link>
            </span>
          ))}
        </div>
      </section>

      <div className="hr" />

      {articles.length === 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);")}>
          <p style={css("opacity:0.6;")}>Nothing here yet for that filter.</p>
        </section>
      )}

      {articles.length > 0 && (
        <section style={css("padding:var(--space-4) var(--space-6) var(--space-8);")}>
          {(() => {
            const [first, ...rest] = articles;
            const card = (a: Article, variant: "lead" | "row") => (
              <ArticleCard key={a.slug} variant={variant} href={`/articles/${a.slug}`} title={a.title} excerpt={a.excerpt} category={a.category} subcategory={a.subcategory}
                date={a.date} readTime={a.readTime} imageUrl={a.featuredImageUrl} paid={a.access === "paid"} />
            );
            return (
              <>
                {card(first, "lead")}
                {rest.length > 0 && <div className="ar-grid">{rest.map((a) => card(a, "row"))}</div>}
              </>
            );
          })()}
        </section>
      )}

      <Footer />
    </div>
  );
}
