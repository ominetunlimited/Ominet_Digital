import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import ShareBar from "@/components/ShareBar";
import { css } from "@/lib/css";
import { getBook } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: "Book — Ominet Digital" };
  const title = `${book.title} — Ominet Digital`;
  const description = book.excerpt || `${book.title} by Omini Nfawa`;
  const url = `${SITE_URL}/books/${book.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "book" },
    twitter: { card: "summary_large_image", title, description },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: "Omini Nfawa" },
    datePublished: book.year,
    bookFormat: book.formats?.[0] ? `https://schema.org/${book.formats[0] === "Ebook" ? "EBook" : book.formats[0]}` : undefined,
    description: book.excerpt,
  };

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <svg width="380" height="380" viewBox="0 0 380 380" style={css("position:absolute;left:-70px;top:30px;pointer-events:none;")} aria-hidden="true">
        <circle cx="190" cy="190" r="189" fill="none" stroke="var(--om-coral)" strokeWidth="1" opacity="0.2" />
        <circle cx="190" cy="190" r="120" fill="none" stroke="var(--om-coral)" strokeWidth="1" opacity="0.14" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:2/3;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:340px;")}>
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImageUrl} alt="" style={css("width:100%;height:100%;object-fit:cover;")} />
          ) : (
            <PlaceholderImage label="Book cover" />
          )}
        </div>
        <div style={css("flex:2 1 380px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{book.kind.toUpperCase()}</div>
          <h1 style={css("font-family:var(--font-heading);font-size:48px;margin:0 0 var(--space-2);")}>{book.title}</h1>
          <div style={css("font-size:15px;opacity:0.65;margin-bottom:var(--space-4);")}>Omini Nfawa &middot; {book.year}{book.pages ? ` · ${book.pages}` : ""}</div>
          <p style={css("font-size:17px;line-height:1.7;opacity:0.8;max-width:56ch;margin:0 0 var(--space-4);")}>{book.excerpt}</p>

          {book.purchaseLinks.length > 0 && (
            <div style={css("margin-bottom:var(--space-6);")}>
              <div style={css("font-size:12px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>WHERE TO BUY</div>
              <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
                {book.purchaseLinks.map((link, i) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={i === 0 ? "btn btn-primary" : "btn btn-secondary"}
                    style={i === 0 ? css("background:var(--om-coral);border-color:var(--om-coral);") : undefined}
                  >
                    {link.label}{BUY_ICON}
                  </a>
                ))}
              </div>
              {book.formats.length > 0 && (
                <div style={css("font-size:12px;opacity:0.5;margin-top:var(--space-2);")}>{book.formats.join(" · ")} &mdash; formats vary by retailer.</div>
              )}
            </div>
          )}

          <ShareBar url={`${SITE_URL}/books/${book.slug}`} title={book.title} />
        </div>
      </section>

      <div className="hr" />

      <section style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>EXCERPT</div>
        <div style={css("font-size:18px;line-height:1.8;margin-bottom:var(--space-8);")}>
          <p>The house had three doors and only one of them still opened. Nkechi kept the other two locked not out of caution but out of a private arithmetic: some rooms should only be entered by the people who left through them.</p>
        </div>

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>AUTHOR&apos;S NOTE</div>
        <p style={css("font-size:16px;line-height:1.75;opacity:0.8;margin-bottom:var(--space-8);")}>I wrote the first draft of this book over five years, in three cities, none of which appear in it by name. It began as a letter I never sent.</p>

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>REVIEWS</div>
        <div style={css("display:grid;gap:var(--space-4);margin-bottom:var(--space-8);")}>
          <div style={css("border-left:2px solid var(--color-divider);padding-left:var(--space-4);")}>
            <p style={css("font-size:16px;font-style:italic;margin:0 0 var(--space-1);")}>&quot;A quiet, exacting novel about the weight of return.&quot;</p>
            <div style={css("font-size:13px;opacity:0.6;")}>&mdash; Continental Review</div>
          </div>
        </div>

        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>RELATED WRITING</div>
        <Link href="/writing/on-writing-as-a-second-country">On Writing as a Second Country &rarr;</Link>
      </section>

      <div className="hr" />

      <Footer />
    </div>
  );
}
