import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import VideoThumbnail from "@/components/VideoThumbnail";
import PaywallGate from "@/components/PaywallGate";
import ShareBar from "@/components/ShareBar";
import AdSlot from "@/components/AdSlot";
import NewsletterForm from "@/components/NewsletterForm";
import { css } from "@/lib/css";
import { getArticle } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";
import { hasEntitlement, getCurrentUser } from "@/lib/entitlements";
import { getEngagement } from "@/lib/engagement";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article — Ominet Digital" };
  const title = article.seoTitle || `${article.title} — Ominet Digital`;
  const description = article.seoDescription || article.excerpt;
  const url = `${SITE_URL}/writing/${article.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
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

  const [unlocked, user, engagement] = await Promise.all([
    article.access !== "paid" ? Promise.resolve(true) : hasEntitlement(article.id),
    getCurrentUser(),
    article.id ? getEngagement({ contentId: article.id }) : Promise.resolve({ likeCount: 0, likedByMe: false, comments: [] }),
  ]);
  const currentPath = `/writing/${article.slug}`;

  const bodyParagraphs = article.body
    ? article.body.split(/\n{2,}/)
    : [
        "There is a particular silence that arrives with a new language — not the absence of words, but the absence of the right ones. For years I mistook this silence for a failure of vocabulary. It was something else: a second country, arriving slowly, with its own weather.",
        "Every migrant writer knows this territory. The first language holds the childhood; the second language holds the adult who has to explain the childhood to people who were never there. Between them is a border that no passport describes.",
      ];
  const visibleParagraphs = unlocked ? bodyParagraphs : bodyParagraphs.slice(0, 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: { "@type": "Person", name: article.author || "Omini Nfawa" },
    publisher: { "@type": "Organization", name: "Ominet Digital" },
    mainEntityOfPage: `${SITE_URL}/writing/${article.slug}`,
  };

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <p key={i}>{p}</p>
          ))}
        </div>

        {!unlocked && (
          <PaywallGate contentId={article.id ?? article.slug} price={article.price} userEmail={user?.email ?? null} currentPath={`/writing/${article.slug}`} />
        )}

        <AdSlot slotKey="article_inline" />

        <ShareBar url={`${SITE_URL}/writing/${article.slug}`} title={article.title} />

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
