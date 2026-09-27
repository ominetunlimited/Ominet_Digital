import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PreviewBanner from "@/components/PreviewBanner";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import VideoThumbnail from "@/components/VideoThumbnail";
import PaywallGate from "@/components/PaywallGate";
import ShareBar from "@/components/ShareBar";
import AdSlot from "@/components/AdSlot";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";
import { css } from "@/lib/css";
import { getArticle, getArticles, getFeaturedBook } from "@/lib/data";
import { ResearchProfileSection } from "@/components/ResearchProfileLinks";
import { getPersonSchema, getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import { hasEntitlement, getCurrentUser } from "@/lib/entitlements";
import { getEngagement } from "@/lib/engagement";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import ReadMoreExcerpt from "@/components/ReadMoreExcerpt";
import RelatedSection from "@/components/RelatedSection";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article" };
  const { identity } = await getSiteSettings();
  const title = article.seoTitle || `${article.title} — ${identity.siteName}`;
  const description = article.seoDescription || article.excerpt;
  const url = `${SITE_URL}/writing/${article.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(article.status && article.status !== "published" ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: article.ogImageUrl || article.featuredImageUrl ? [article.ogImageUrl || article.featuredImageUrl!] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.ogImageUrl || article.featuredImageUrl ? [article.ogImageUrl || article.featuredImageUrl!] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const [unlocked, user, engagement, featuredBook, otherArticles] = await Promise.all([
    article.access !== "paid" ? Promise.resolve(true) : hasEntitlement(article.id),
    getCurrentUser(),
    article.id ? getEngagement({ contentId: article.id }) : Promise.resolve({ likeCount: 0, likedByMe: false, comments: [] }),
    getFeaturedBook(),
    getArticles(),
  ]);
  const currentPath = `/writing/${article.slug}`;
  const moreFromOmini = otherArticles.find((a) => a.slug !== article.slug);

  const bodyParagraphs = article.body ? article.body.split(/\n{2,}/) : [];
  const visibleParagraphs = unlocked ? bodyParagraphs : bodyParagraphs.slice(0, 1);

  const { identity: siteIdentity } = await getSiteSettings();
  const isResearch = /research|thesis|academic|paper/i.test(article.category ?? "");
  const personSchema = await getPersonSchema(article.author || "Omini Nfawa");

  const jsonLd = jsonLdGraph([
    {
      "@type": isResearch ? "ScholarlyArticle" : "Article",
      "@id": `${SITE_URL}/writing/${article.slug}#article`,
      headline: article.title,
      description: article.excerpt,
      datePublished: article.date,
      author: personSchema,
      publisher: getOrganizationSchema(siteIdentity.siteName),
      mainEntityOfPage: `${SITE_URL}/writing/${article.slug}`,
      ...(article.externalUrl ? { sameAs: [article.externalUrl] } : {}),
    },
    personSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Writing", path: "/writing" },
      { name: article.title, path: `/writing/${article.slug}` },
    ]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PreviewBanner status={article.status} editHref={article.id ? `/admin/content/${article.id}` : undefined} />
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

        <div style={css("aspect-ratio:16/9;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-6);")}>
          {article.featuredImageUrl ? (
            <Image src={article.featuredImageUrl} alt="" fill sizes="(max-width: 760px) 100vw, 720px" style={{ objectFit: "cover" }} priority />
          ) : (
            <PlaceholderImage label="Hero image" />
          )}
        </div>

        {article.videoUrl && (
          <div style={css("margin-bottom:var(--space-6);")}>
            <VideoThumbnail url={article.videoUrl} thumbnailUrl={article.videoThumbnailUrl} />
          </div>
        )}

        <div style={css("font-size:18px;line-height:1.8;")}>
          {visibleParagraphs.map((p, i) => (
            <p key={i} style={css("margin:0 0 var(--space-5, 1.4em);")}>{p}</p>
          ))}
        </div>

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
          <PaywallGate contentId={article.id ?? article.slug} price={article.price} userEmail={user?.email ?? null} currentPath={`/writing/${article.slug}`} />
        )}

        <AdSlot slotKey="article_inline" />

        {isResearch && <ResearchProfileSection placement="research" title="THE AUTHOR'S RESEARCH PROFILES" padded={false} />}

        <ShareBar url={`${SITE_URL}/writing/${article.slug}`} title={article.title} />

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
              <Link href={`/writing/${moreFromOmini.slug}`} style={css("display:block;")}>
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
            <CommentSection target={{ contentId: article.id }} comments={engagement.comments} signedIn={Boolean(user)} currentPath={currentPath} />
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
