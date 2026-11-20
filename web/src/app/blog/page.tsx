import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BlogCard from "@/components/cards/BlogCard";
import NewsletterForm from "@/components/NewsletterForm";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getBlogIndex, getBlogCategories, getFeaturedPost, getArchiveMonths, fmtDate, readLabel } from "@/lib/blog";
import { jsonLdGraph, breadcrumbSchema } from "@/lib/schema";

export const revalidate = 60;

type SP = { q?: string; category?: string; month?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const base = await pageMetadata("Blog: News, Features and Updates", "News, events, features, tutorials and updates from Ominet Digital.", "/blog");
  // Filtered and paged views are useful to visitors but are not separate pages for search engines.
  return sp.q || sp.category || sp.month || (sp.page && sp.page !== "1") ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filtered = Boolean(sp.q || sp.category || sp.month);
  const [{ posts, total, pages }, categories, featured, months] = await Promise.all([
    getBlogIndex({ q: sp.q, category: sp.category, month: sp.month, page }),
    getBlogCategories(), filtered ? Promise.resolve(null) : getFeaturedPost(), getArchiveMonths(),
  ]);
  const showFeatured = !filtered && page === 1 ? featured : null;
  const list = showFeatured ? posts.filter((p) => p.id !== showFeatured.id) : posts;
  const href = (over: Record<string, string>) => {
    const m: Record<string, string> = { q: sp.q ?? "", category: sp.category ?? "", month: sp.month ?? "", page: "", ...over };
    const qs = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `/blog${qs ? `?${qs}` : ""}`;
  };
  const jsonLd = jsonLdGraph([
    { "@type": "Blog", "@id": `${SITE_URL}/blog#blog`, name: "Ominet Digital Blog", url: `${SITE_URL}/blog`, blogPost: posts.slice(0, 10).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.publishedAt })) },
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="bl-wrap">
        <div className="bl-eyebrow">Ominet Digital Blog</div>
        <h1 className="bl-h1">News, features and updates</h1>
        <p className="bl-lede">Company news, events, technology, reviews, tutorials, opinion and the stories people are talking about.</p>

        {showFeatured && (
          <article className="bl-feature" aria-label="Featured story">
            <div className="bl-feature-media">
              {showFeatured.featuredImageUrl ? <Image src={showFeatured.featuredImageUrl} alt={showFeatured.featuredImageAlt ?? ""} fill priority sizes="(max-width: 800px) 92vw, 660px" style={{ objectFit: "cover" }} /> : <PlaceholderImage kind="article" title={showFeatured.title} />}
            </div>
            <div>
              {showFeatured.category && <div className="bl-cat" style={css("margin-bottom:var(--space-2);")}>{showFeatured.category.name} · Featured</div>}
              <h2>{showFeatured.title}</h2>
              {(showFeatured.dek || showFeatured.excerpt) && <p>{showFeatured.dek || showFeatured.excerpt}</p>}
              <div className="bl-meta" style={css("margin-bottom:var(--space-4);")}><span>{showFeatured.authorName}</span><span>{fmtDate(showFeatured.publishedAt)}</span>{showFeatured.readMinutes && <span>{readLabel(showFeatured.readMinutes)}</span>}</div>
              <Link className="btn btn-primary" href={`/blog/${showFeatured.slug}`}>Read the full story</Link>
            </div>
          </article>
        )}

        <div className="bl-bar">
          <nav className="bl-chips" aria-label="Categories">
            <Link className="bl-chip" href="/blog" aria-current={!sp.category}>All</Link>
            {categories.map((c) => <Link key={c.id} className="bl-chip" href={href({ category: c.slug, page: "" })} aria-current={sp.category === c.slug}>{c.name}</Link>)}
          </nav>
          <form action="/blog" method="get" role="search" style={css("display:flex;gap:8px;flex-wrap:wrap;")}>
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <input className="input" type="search" name="q" defaultValue={sp.q ?? ""} placeholder="Search articles" aria-label="Search articles" style={css("min-width:200px;")} />
            <select className="input" name="month" defaultValue={sp.month ?? ""} aria-label="Browse by month" style={css("min-width:160px;")}>
              <option value="">Any date</option>
              {months.map((m) => <option key={m.key} value={m.key}>{m.label} ({m.count})</option>)}
            </select>
            <button className="btn btn-secondary" type="submit">Search</button>
          </form>
        </div>

        {filtered && <p style={css("font-size:14px;opacity:0.75;margin:0 0 var(--space-4);")} role="status">{total} {total === 1 ? "article" : "articles"} found. <Link href="/blog">Clear filters</Link></p>}

        {list.length === 0 ? (
          <p style={css("font-size:16px;opacity:0.75;padding:var(--space-8) 0;")}>{filtered ? "No articles match that search." : showFeatured ? "More articles are on the way." : "The first articles are on the way. Subscribe below to hear when they are published."}</p>
        ) : (
          <div className="bl-grid">
            {list.map((p) => <BlogCard key={p.id} href={`/blog/${p.slug}`} title={p.title} excerpt={p.excerpt || p.dek} category={p.category?.name} date={fmtDate(p.publishedAt)} readTime={readLabel(p.readMinutes)} author={p.authorName} imageUrl={p.featuredImageUrl} imageAlt={p.featuredImageAlt} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="bl-pager" aria-label="Pagination">
            {page > 1 ? <Link className="btn btn-secondary" href={href({ page: String(page - 1) })} rel="prev">Newer</Link> : <span />}
            <span>Page {page} of {pages}</span>
            {page < pages ? <Link className="btn btn-secondary" href={href({ page: String(page + 1) })} rel="next">Older articles</Link> : <span />}
          </nav>
        )}

        <section aria-labelledby="bl-news" style={css("margin-top:var(--space-10,80px);padding:var(--space-6);border-radius:var(--radius-lg);background:var(--color-surface);max-width:640px;")}>
          <h2 id="bl-news" style={css("font-family:var(--font-heading);font-size:24px;margin:0 0 var(--space-2);")}>Get new articles by email</h2>
          <p style={css("font-size:14px;opacity:0.75;margin:0 0 var(--space-3);")}>Join the newsletter. You can unsubscribe at any time.</p>
          <NewsletterForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
