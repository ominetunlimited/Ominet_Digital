import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PreviewBanner from "@/components/PreviewBanner";
import RichText from "@/components/RichText";
import ShareBar from "@/components/ShareBar";
import NewsletterForm from "@/components/NewsletterForm";
import BlogCard from "@/components/cards/BlogCard";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { SITE_URL } from "@/lib/seo";
import { ogVariant } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/site-settings";
import { getBlogPost, getRelatedPosts, fmtDate, readLabel, DEFAULT_AUTHOR } from "@/lib/blog";
import { getPersonSchema, getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article" };
  const { identity } = await getSiteSettings();
  const title = post.seoTitle || `${post.title} — ${identity.siteName}`;
  const description = post.seoDescription || post.excerpt || post.dek || undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;
  // The dedicated 1:1 image leads for Open Graph (Facebook, WhatsApp, LinkedIn…); the featured image is the fallback.
  // X's large card needs a wide image, so it gets a landscape crop of the featured image. Originals are never altered.
  const square = ogVariant(post.socialImageUrl || post.featuredImageUrl || post.ogImageUrl, "square");
  const wide = ogVariant(post.featuredImageUrl || post.ogImageUrl || post.socialImageUrl, "landscape");
  const squareAlt = post.socialImageAlt || post.featuredImageAlt || post.title;
  const wideAlt = post.featuredImageAlt || post.title;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(post.status !== "published" ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title, description, url, type: "article", siteName: identity.siteName, publishedTime: post.publishedAt ?? undefined, modifiedTime: post.updatedAt ?? undefined,
      authors: [post.authorName], section: post.category?.name, tags: post.tags.map((t) => t.name),
      images: [{ ...square, alt: squareAlt }, { ...wide, alt: wideAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: wide.url, alt: wideAlt }] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const [related, { identity }] = await Promise.all([getRelatedPosts(post), getSiteSettings()]);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const square = ogVariant(post.socialImageUrl || post.featuredImageUrl || post.ogImageUrl, "square");
  const wide = ogVariant(post.featuredImageUrl || post.ogImageUrl || post.socialImageUrl, "landscape");
  const author = post.authorName === DEFAULT_AUTHOR ? await getPersonSchema(DEFAULT_AUTHOR) : { "@type": "Person", name: post.authorName };
  const showUpdated = post.updatedAt && post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 24 * 3600_000;

  const jsonLd = jsonLdGraph([
    {
      "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title, description: post.seoDescription || post.excerpt || post.dek || undefined,
      image: [square.url, wide.url], datePublished: post.publishedAt ?? undefined, dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
      author, publisher: getOrganizationSchema(identity.siteName), mainEntityOfPage: url,
      articleSection: post.category?.name, keywords: post.tags.length ? post.tags.map((t) => t.name).join(", ") : undefined, inLanguage: "en",
    },
    breadcrumbSchema([
      { name: "Home", path: "/" }, { name: "Blog", path: "/blog" },
      ...(post.category ? [{ name: post.category.name, path: `/blog?category=${post.category.slug}` }] : []), { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PreviewBanner status={post.status} editHref={`/admin/content/${post.id}`} />
      <Nav />
      <article className="bl-article">
        <nav className="bl-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li><li><Link href="/blog">Blog</Link></li>
            {post.category && <li><Link href={`/blog?category=${post.category.slug}`}>{post.category.name}</Link></li>}
            <li aria-current="page">{post.title.length > 48 ? `${post.title.slice(0, 46)}…` : post.title}</li>
          </ol>
        </nav>
        {post.category && <div className="bl-cat" style={css("margin-bottom:var(--space-2);")}>{post.category.name}</div>}
        <h1>{post.title}</h1>
        {post.dek && <p style={css("font-size:20px;line-height:1.5;opacity:0.78;margin:0 0 var(--space-4);")}>{post.dek}</p>}
        <div className="bl-meta" style={css("margin-bottom:var(--space-5);")}>
          <span>By {post.authorName}</span>
          <span><time dateTime={post.publishedAt ?? undefined}>{fmtDate(post.publishedAt)}</time></span>
          {showUpdated && <span>Updated <time dateTime={post.updatedAt!}>{fmtDate(post.updatedAt)}</time></span>}
          {post.readMinutes && <span>{readLabel(post.readMinutes)}</span>}
        </div>
        <div style={css("position:relative;aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-6);")}>
          {post.featuredImageUrl ? <Image src={post.featuredImageUrl} alt={post.featuredImageAlt ?? ""} fill priority sizes="(max-width: 760px) 100vw, 720px" style={{ objectFit: "cover" }} /> : <PlaceholderImage kind="article" title={post.title} />}
        </div>
        <RichText html={post.body} className="bl-body" />
        {post.tags.length > 0 && (
          <ul aria-label="Tags" style={css("list-style:none;display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:var(--space-6) 0 0;")}>
            {post.tags.map((t) => <li key={t.slug} className="tag tag-outline">{t.name}</li>)}
          </ul>
        )}
        <div className="bl-author">
          <div>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.55;")}>WRITTEN BY</div>
            <div style={css("font-family:var(--font-heading);font-size:18px;")}>{post.authorName}</div>
            {post.authorBio && <p style={css("font-size:14px;line-height:1.6;opacity:0.78;margin:var(--space-1) 0 0;")}>{post.authorBio}</p>}
          </div>
        </div>
        <ShareBar url={url} title={post.title} />
      </article>

      {related.length > 0 && (
        <section aria-labelledby="bl-rel" style={css("max-width:1200px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
          <h2 id="bl-rel" style={css("font-family:var(--font-heading);font-size:26px;margin:0 0 var(--space-4);")}>Related articles</h2>
          <div className="bl-grid">
            {related.map((p) => <BlogCard key={p.id} href={`/blog/${p.slug}`} title={p.title} excerpt={p.excerpt || p.dek} category={p.category?.name} date={fmtDate(p.publishedAt)} readTime={readLabel(p.readMinutes)} author={p.authorName} imageUrl={p.featuredImageUrl} imageAlt={p.featuredImageAlt} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="bl-news" style={css("max-width:720px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
        <div style={css("padding:var(--space-6);border-radius:var(--radius-lg);background:var(--color-surface);")}>
          <h2 id="bl-news" style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-2);")}>Get new articles by email</h2>
          <NewsletterForm />
        </div>
      </section>
      <Footer />
    </div>
  );
}
