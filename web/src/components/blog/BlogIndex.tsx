import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BlogCard from "@/components/cards/BlogCard";
import NewsletterForm from "@/components/NewsletterForm";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getBlogIndex, getCategoryTree, getCategoryBySlug, getFeaturedPost, getArchiveMonths, fmtDate, readLabel } from "@/lib/blog";
import { jsonLdGraph, breadcrumbSchema } from "@/lib/schema";

export type BlogSP = { q?: string; category?: string; month?: string; page?: string };

export default async function BlogIndex({ sp: rawSp, categorySlug }: { sp: BlogSP; categorySlug?: string }) {
  const sp: BlogSP = { ...rawSp, category: categorySlug ?? rawSp.category };
  const base = categorySlug ? `/blog/category/${categorySlug}` : "/blog";
  const page = Math.max(1, Number(sp.page) || 1);
  const filtered = Boolean(sp.q || sp.category || sp.month);
  const current = categorySlug ? await getCategoryBySlug(categorySlug) : null;
  const [{ posts, total, pages }, tree, featured, months] = await Promise.all([
    getBlogIndex({ q: sp.q, category: sp.category, month: sp.month, page }),
    getCategoryTree(), filtered ? Promise.resolve(null) : getFeaturedPost(), getArchiveMonths(),
  ]);
  const showFeatured = !filtered && page === 1 ? featured : null;
  const list = showFeatured ? posts.filter((p) => p.id !== showFeatured.id) : posts;
  const href = (over: Record<string, string>) => {
    const m: Record<string, string> = { q: sp.q ?? "", month: sp.month ?? "", page: "", ...over };
    const qs = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `${base}${qs ? `?${qs}` : ""}`;
  };
  const jsonLd = jsonLdGraph([
    { "@type": "Blog", "@id": `${SITE_URL}/blog#blog`, name: "Ominet Digital Blog", url: `${SITE_URL}/blog`, blogPost: posts.slice(0, 10).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.publishedAt })) },
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, ...(current?.parent ? [{ name: current.parent.name, path: `/blog/category/${current.parent.slug}` }] : []), ...(current ? [{ name: current.node.name, path: `/blog/category/${current.node.slug}` }] : [])]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="bl-wrap">
        <div className="bl-eyebrow">Ominet Digital Blog</div>
        <h1 className="bl-h1">{current ? current.node.name : "News, features and updates"}</h1>
        <p className="bl-lede">{current ? (current.node.description ?? "") : "Timely posts on sport, technology, news, reviews, opinion, science, AI, business and culture. Long-form work lives in Articles."}</p>
        {current && <nav aria-label="Breadcrumb" style={css("font-size:13px;opacity:0.7;margin:calc(var(--space-2) * -1) 0 var(--space-4);")}><Link href="/blog">Blog</Link>{current.parent && <> / <Link href={`/blog/category/${current.parent.slug}`}>{current.parent.name}</Link></>} / {current.node.name}</nav>}

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
          <form action="/blog" method="get" role="search" style={css("display:flex;gap:8px;flex-wrap:wrap;")}>
            <input className="input" type="search" name="q" defaultValue={sp.q ?? ""} placeholder="Search articles" aria-label="Search articles" style={css("min-width:200px;")} />
            {tree.length > 0 && (
              <select className="input" name="category" defaultValue={current?.parent?.slug ?? current?.node.slug ?? ""} aria-label="Filter by topic" style={css("min-width:160px;")}>
                <option value="">All topics</option>
                {tree.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
              </select>
            )}
            <select className="input" name="month" defaultValue={sp.month ?? ""} aria-label="Browse by month" style={css("min-width:160px;")}>
              <option value="">Any date</option>
              {months.map((m) => <option key={m.key} value={m.key}>{m.label} ({m.count})</option>)}
            </select>
            <button className="btn btn-secondary" type="submit">Search</button>
          </form>
        </div>

        {(sp.q || sp.month) && <p style={css("font-size:14px;opacity:0.75;margin:0 0 var(--space-4);")} role="status">{total} {total === 1 ? "article" : "articles"} found. <Link href={base}>Clear filters</Link></p>}

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
