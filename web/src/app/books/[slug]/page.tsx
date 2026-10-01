import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PreviewBanner from "@/components/PreviewBanner";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import ShareBar from "@/components/ShareBar";
import TrackedLink from "@/components/TrackedLink";
import { css } from "@/lib/css";
import { getBook } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";
import { ogImage } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/site-settings";
import { getPersonSchema, getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { getCurrentUser, hasBookEntitlement } from "@/lib/entitlements";
import { getBookDelivery } from "@/lib/books/delivery";
import BookAccess from "@/components/BookAccess";
import AdSlot from "@/components/AdSlot";
import RelatedSection from "@/components/RelatedSection";
import { truncate } from "@/lib/text";
import { getEngagement } from "@/lib/engagement";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: "Book" };
  const { identity } = await getSiteSettings();
  const title = book.seoTitle || `${book.title} — ${identity.siteName}`;
  const description = book.seoDescription || (book.excerpt ? truncate(book.excerpt, 200) : `${book.title} by ${book.author || "Omini Nfawa"}`);
  const url = `${SITE_URL}/books/${book.slug}`;
  const image = ogImage(book.ogImageUrl || book.coverImageUrl);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(book.status && book.status !== "published" ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, url, type: "book", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const BUY_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const currentPath = `/books/${book.slug}`;
  const [user, engagement, delivery, owned] = await Promise.all([
    getCurrentUser(),
    book.id ? getEngagement({ bookId: book.id }) : Promise.resolve({ likeCount: 0, likedByMe: false, comments: [] }),
    book.id ? getBookDelivery(book.id) : Promise.resolve(null),
    hasBookEntitlement(book.id),
  ]);

  const { identity, comments: commentSettings } = await getSiteSettings();
  const personSchema = await getPersonSchema(book.author || "Omini Nfawa");
  const jsonLd = jsonLdGraph([
    {
      "@type": "Book",
      "@id": `${SITE_URL}/books/${book.slug}#book`,
      name: book.title,
      author: personSchema,
      publisher: getOrganizationSchema(identity.siteName),
      datePublished: book.year,
      bookFormat: book.formats?.[0] ? `https://schema.org/${book.formats[0] === "Ebook" ? "EBook" : book.formats[0]}` : undefined,
      description: book.excerpt,
      url: `${SITE_URL}/books/${book.slug}`,
    },
    personSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Books", path: "/books" },
      { name: book.title, path: `/books/${book.slug}` },
    ]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PreviewBanner status={book.status} editHref={book.id ? `/admin/books/${book.id}` : undefined} />
      <Nav />
      <svg width="380" height="380" viewBox="0 0 380 380" style={css("position:absolute;left:-70px;top:30px;pointer-events:none;")} aria-hidden="true">
        <circle cx="190" cy="190" r="189" fill="none" stroke="var(--om-coral)" strokeWidth="1" opacity="0.2" />
        <circle cx="190" cy="190" r="120" fill="none" stroke="var(--om-coral)" strokeWidth="1" opacity="0.14" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:2/3;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:340px;")}>
          {book.coverImageUrl ? (
            <Image src={book.coverImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 340px" style={{ objectFit: "cover" }} priority />
          ) : (
            <PlaceholderImage label="Book cover" />
          )}
        </div>
        <div style={css("flex:2 1 380px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{book.kind.toUpperCase()}</div>
          <h1 style={css("font-family:var(--font-heading);font-size:48px;margin:0 0 var(--space-2);")}>{book.title}</h1>
          <div style={css("font-size:15px;opacity:0.65;margin-bottom:var(--space-4);")}>Omini Nfawa &middot; {book.year}{book.pages ? ` · ${book.pages}` : ""}</div>
          <p style={css("font-size:17px;line-height:1.7;opacity:0.8;max-width:56ch;margin:0 0 var(--space-4);")}>{truncate(book.excerpt, 320)}</p>

          {book.id && delivery && <BookAccess bookId={book.id} delivery={delivery} owned={owned} signedIn={Boolean(user)} />}

          {book.purchaseLinks.length > 0 && (
            <div style={css("margin-bottom:var(--space-6);")}>
              <div style={css("font-size:12px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>{delivery ? "ALSO AVAILABLE FROM" : "WHERE TO BUY"}</div>
              <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
                {book.purchaseLinks.map((link, i) => (
                  <TrackedLink
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={i === 0 ? "btn btn-primary" : "btn btn-secondary"}
                    style={i === 0 ? css("background:var(--om-coral);border-color:var(--om-coral);") : undefined}
                    eventMetadata={{ kind: "purchase_link", platform: link.platform, book_slug: book.slug, book_title: book.title }}
                  >
                    {link.label}{BUY_ICON}
                  </TrackedLink>
                ))}
              </div>
              {book.formats.length > 0 && (
                <div style={css("font-size:12px;opacity:0.5;margin-top:var(--space-2);")}>{book.formats.join(" · ")} &mdash; formats vary by retailer.</div>
              )}
            </div>
          )}

          <AdSlot slotKey="book_page" />

          <ShareBar url={`${SITE_URL}/books/${book.slug}`} title={book.title} />
        </div>
      </section>

      <div className="hr" />

      {book.excerpt && (
        <section style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6) 0;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>EXCERPT</div>
          <div style={css("font-size:18px;line-height:1.8;margin-bottom:var(--space-8);")}>
            {book.excerpt.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>
      )}

      <section style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);")}>
        {book.authorNote && (
          <>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>AUTHOR&apos;S NOTE</div>
            <p style={css("font-size:16px;line-height:1.75;opacity:0.8;margin-bottom:var(--space-8);")}>{book.authorNote}</p>
          </>
        )}

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>MORE WRITING</div>
        <Link href="/writing">Browse all writing &rarr;</Link>

        {book.id && (
          <>
            <div className="hr" style={css("margin:var(--space-8) 0 var(--space-6);")} />
            <LikeButton
              target={{ bookId: book.id }}
              initialCount={engagement.likeCount}
              initialLiked={engagement.likedByMe}
              currentPath={currentPath}
            />
            <div className="hr" style={css("margin:var(--space-6) 0;")} />
            <CommentSection target={{ bookId: book.id }} comments={engagement.comments} signedIn={Boolean(user)} currentPath={currentPath} requireSignIn={commentSettings.requireSignIn} />
          </>
        )}
      </section>

      <div className="hr" />
      <RelatedSection type="book" id={book.id} />

      <Footer />
    </div>
  );
}
