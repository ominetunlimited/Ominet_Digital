import { getReadCount } from "@/lib/reads";
import ReadsBadge from "@/components/ReadsBadge";
import ReadTracker from "@/components/ReadTracker";
import RichText from "@/components/RichText";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import PreviewBanner from "@/components/PreviewBanner";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import VideoThumbnail from "@/components/VideoThumbnail";
import PaywallGate from "@/components/PaywallGate";
import ShareBar from "@/components/ShareBar";
import { getShortUrl } from "@/lib/short-links";
import AdSlot from "@/components/AdSlot";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";
import { css } from "@/lib/css";
import { getArticle, getArticles, getFeaturedBook } from "@/lib/data";
import { ResearchProfileSection } from "@/components/ResearchProfileLinks";
import { getPersonSchema, getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
import { ogImage } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/site-settings";
import { hasEntitlement, getCurrentUser } from "@/lib/entitlements";
import { getEngagement, getReviewSummary } from "@/lib/engagement";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import ReviewSection from "@/components/ReviewSection";
import ReadMoreExcerpt from "@/components/ReadMoreExcerpt";
import RelatedSection from "@/components/RelatedSection";
import { getArticleExtras, EDITORIAL_LABELS } from "@/lib/article-extras";
import { withHeadingAnchors } from "@/lib/rich-text";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article" };
  const { identity } = await getSiteSettings();
  const title = article.seoTitle || `${article.title} — ${identity.siteName}`;
  const description = article.seoDescription || article.excerpt;
  const url = `${SITE_URL}/articles/${article.slug}`;
  const image = ogImage(article.ogImageUrl || article.featuredImageUrl);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(article.status && article.status !== "published" ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, url, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Blog articles have one home, /blog/<slug>; the old path forwards there.
  const db = await createClient();
  const { data: flag } = db ? await db.from("content").select("in_blog").eq("slug", slug).maybeSingle() : { data: null };
  if (flag?.in_blog) redirect(`/blog/${slug}`);
  const article = await getArticle(slug);
  if (!article) notFound();
  const readCount = await getReadCount("articles", article.slug);

  const [unlocked, user, engagement, reviewSummary, featuredBook, otherArticles, extras] = await Promise.all([
    article.access !== "paid" ? Promise.resolve(true) : hasEntitlement(article.id),
    getCurrentUser(),
    article.id ? getEngagement({ contentId: article.id }) : Promise.resolve({ likeCount: 0, likedByMe: false, comments: [] }),
    article.id ? getReviewSummary({ contentId: article.id }) : Promise.resolve({ average: 0, count: 0, reviews: [], myReview: null }),
    getFeaturedBook(),
    getArticles(),
    getArticleExtras(slug),
  ]);
  const anchored = extras?.showToc !== false && article.body ? withHeadingAnchors(article.body) : null;
  const toc = anchored && anchored.toc.length >= 3 ? anchored.toc : [];
  const currentPath = `/articles/${article.slug}`;
  const moreFromOmini = otherArticles.find((a) => a.slug !== article.slug);

  // Body is rich HTML from the admin editor (RichTextEditor). A locked
  // (paid, not-yet-unlocked) article shows no body at all rather than a
  // truncated slice of arbitrary HTML — the dek/excerpt above already
  // serves as its teaser, and PaywallGate follows immediately after.

  const { identity: siteIdentity, comments: commentSettings } = await getSiteSettings();
  const isResearch = /research|thesis|academic|paper/i.test(article.category ?? "");
  const personSchema = await getPersonSchema(article.author || "Omini Nfawa");

  const jsonLd = jsonLdGraph([
    {
      "@type": isResearch ? "ScholarlyArticle" : "Article",
      "@id": `${SITE_URL}/articles/${article.slug}#article`,
      headline: article.title,
      description: article.excerpt,
      ...(extras?.publishedAt ? { datePublished: extras.publishedAt } : {}),
      ...(extras?.updatedAt ? { dateModified: extras.updatedAt } : {}),
      ...(article.featuredImageUrl ? { image: [article.featuredImageUrl] } : {}),
      author: personSchema,
      publisher: getOrganizationSchema(siteIdentity.siteName),
      mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
      ...(article.externalUrl ? { sameAs: [article.externalUrl] } : {}),
    },
    personSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
      { name: article.title, path: `/articles/${article.slug}` },
    ]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:clip;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PreviewBanner status={article.status} editHref={article.id ? `/admin/content/${article.id}` : undefined} />
      <Nav />
      <svg width="300" height="300" viewBox="0 0 300 300" style={css("position:absolute;right:-70px;top:40px;pointer-events:none;")} aria-hidden="true">
        <circle cx="150" cy="150" r="149" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.16" />
      </svg>

      <article style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);")}>
        <div style={css("display:flex;gap:var(--space-3);align-items:center;font-size:12px;opacity:0.6;margin-bottom:var(--space-4);")}>
          {extras?.editorialLabel && <span className="tag tag-neutral" style={css("background:var(--om-navy);color:#fff;")}>{EDITORIAL_LABELS[extras.editorialLabel] ?? extras.editorialLabel}</span>}
          <span className="tag tag-neutral">{article.category}</span>
          {article.subcategory && <span className="tag tag-outline">{article.subcategory}</span>}
          <span>{article.date}</span>
          <span>&middot;</span>
          <span>{article.readTime} read</span>
        </div>
        <h1 style={css("font-family:var(--font-heading);font-size:44px;line-height:1.1;margin:0 0 var(--space-3);")}>{article.title}</h1>
        {article.dek && <p style={css("font-size:19px;line-height:1.5;opacity:0.75;margin:0 0 var(--space-4);")}>{article.dek}</p>}
        <div style={css("font-size:13px;opacity:0.6;margin-bottom:var(--space-4);display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;")}><span>By {article.author}{extras?.contributors ? ` · With ${extras.contributors}` : ""}{extras?.updatedAt && article.date && new Date(extras.updatedAt).getTime() - new Date(article.date).getTime() > 2 * 86400000 ? ` · Updated ${new Date(extras.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" })}` : ""}</span><ReadsBadge reads={readCount} /><ReadTracker kind="articles" slug={article.slug} /></div>
        {extras?.abstract && <div style={css("font-size:16px;line-height:1.7;padding:var(--space-4);background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:var(--space-5);")}><strong style={css("display:block;font-size:11px;letter-spacing:0.1em;opacity:0.6;margin-bottom:6px;")}>ABSTRACT</strong>{extras.abstract}</div>}
        {toc.length > 0 && (
          <nav aria-label="Table of contents" style={css("margin-bottom:var(--space-6);font-size:14px;")}>
            <strong style={css("display:block;font-size:11px;letter-spacing:0.1em;opacity:0.6;margin-bottom:6px;")}>CONTENTS</strong>
            <ol style={css("margin:0;padding-left:1.2em;display:grid;gap:4px;")}>
              {toc.map((t) => <li key={t.id} style={css(t.level === 3 ? "margin-left:1em;list-style:circle;" : "")}><a href={`#${t.id}`}>{t.text}</a></li>)}
            </ol>
          </nav>
        )}

        <div style={css("aspect-ratio:16/9;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-6);")}>
          {article.featuredImageUrl ? (
            <Image src={article.featuredImageUrl} alt={extras?.featuredImageAlt ?? ""} fill sizes="(max-width: 760px) 100vw, 720px" style={{ objectFit: "cover" }} priority />
          ) : (
            <PlaceholderImage label="Hero image" />
          )}
        </div>

        {extras?.imageCredit && <p style={css("font-size:12px;opacity:0.6;margin:calc(var(--space-4) * -1) 0 var(--space-5);")}>Image: {extras.imageCredit}</p>}
        {extras?.disclosure && <p role="note" style={css("font-size:14px;line-height:1.6;padding:var(--space-3);border-left:3px solid var(--om-cyan);background:var(--color-surface);margin:0 0 var(--space-5);")}><strong>Disclosure.</strong> {extras.disclosure}</p>}

        {article.videoUrl && (
          <div style={css("margin-bottom:var(--space-6);")}>
            <VideoThumbnail url={article.videoUrl} thumbnailUrl={article.videoThumbnailUrl} />
          </div>
        )}

        {unlocked && article.body && (
          <RichText html={article.body} anchors={toc.length > 0} style={css("font-size:18px;line-height:1.8;")} />
        )}

        {unlocked && extras?.correctionNote && <p role="note" style={css("font-size:14px;line-height:1.6;padding:var(--space-3);border-left:3px solid #D4AF37;background:var(--color-surface);margin:var(--space-5) 0 0;")}><strong>Correction.</strong> {extras.correctionNote}</p>}

        {unlocked && extras?.referencesHtml && (
          <section aria-labelledby="refs" style={css("margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--color-divider);")}>
            <h2 id="refs" style={css("font-family:var(--font-heading);font-size:20px;margin:0 0 var(--space-3);")}>References and notes</h2>
            <RichText html={extras.referencesHtml} style={css("font-size:15px;line-height:1.7;")} />
          </section>
        )}

        {((article.attachmentFormat && unlocked && article.id) || article.externalUrl) && (
          <div style={css("margin:var(--space-6) 0;display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            {article.attachmentFormat && unlocked && article.id && (
              <a href={`/api/content/download?content=${article.id}`} rel="nofollow" className="btn btn-secondary">
                Download {article.attachmentFormat === "pdf" ? "PDF" : "Word (DOCX)"}
              </a>
            )}
            {article.externalUrl && (
              <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Read on {article.externalLabel || "ResearchGate"} &#8599;
              </a>
            )}
          </div>
        )}

        {!unlocked && (
          <PaywallGate contentId={article.id ?? article.slug} price={article.price} userEmail={user?.email ?? null} currentPath={`/articles/${article.slug}`} />
        )}

        <AdSlot slotKey="article_inline" />

        {isResearch && <ResearchProfileSection placement="research" title="THE AUTHOR'S RESEARCH PROFILES" padded={false} />}

        <ShareBar url={`${SITE_URL}/articles/${article.slug}`} shortUrl={await getShortUrl(`/articles/${article.slug}`)} title={article.title} />

        {(featuredBook || moreFromOmini) && (
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4);margin-bottom:var(--space-8);")}>
            {featuredBook && (
              <Link href={`/books/${featuredBook.slug}`} style={css("display:block;")}>
                <div className="card">
                  <div className="card-kicker">FEATURED BOOK</div>
                  <div className="card-title">{featuredBook.title}</div>
                  <ReadMoreExcerpt text={featuredBook.excerpt} className="card-body" />
                </div>
              </Link>
            )}
            {moreFromOmini && (
              <Link href={`/articles/${moreFromOmini.slug}`} style={css("display:block;")}>
                <div className="card">
                  <div className="card-kicker">MORE FROM OMINI</div>
                  <div className="card-title">{moreFromOmini.title}</div>
                  <ReadMoreExcerpt text={moreFromOmini.excerpt} className="card-body" />
                </div>
              </Link>
            )}
          </div>
        )}

        {article.id && (
          <>
            <LikeButton
              target={{ contentId: article.id }}
              initialCount={engagement.likeCount}
              initialLiked={engagement.likedByMe}
              currentPath={currentPath}
            />
            <div className="hr" style={css("margin:var(--space-6) 0;")} />
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RATINGS &amp; REVIEWS</div>
            <ReviewSection
              target={{ contentId: article.id }}
              average={reviewSummary.average}
              count={reviewSummary.count}
              reviews={reviewSummary.reviews}
              myReview={reviewSummary.myReview}
              signedIn={Boolean(user)}
              currentPath={currentPath}
              requireSignIn={commentSettings.requireSignIn}
            />
            <div className="hr" style={css("margin:var(--space-6) 0;")} />
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>COMMENTS</div>
            <CommentSection target={{ contentId: article.id }} comments={engagement.comments} signedIn={Boolean(user)} currentPath={currentPath} requireSignIn={commentSettings.requireSignIn} />
          </>
        )}
      </article>

      <div className="hr" />
      <RelatedSection type="content" id={article.id} />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
        <div style={css("flex:1 1 260px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>NEWSLETTER</div>
          <div style={css("font-family:var(--font-heading);font-size:24px;")}>New writing and book news, occasionally.</div>
        </div>
        <NewsletterForm />
      </section>

      <Footer />
    </div>
  );
}
