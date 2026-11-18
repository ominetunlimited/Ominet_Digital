import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EmptyState from "@/components/EmptyState";
import { css } from "@/lib/css";
import { getBooks } from "@/lib/data";
import { AMAZON_AUTHOR_URL } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { truncate } from "@/lib/text";
import { collectionPageSchema } from "@/lib/schema";

function BookCover({ url, label, sizes }: { url?: string; label: string; sizes: string }) {
  if (!url) return <PlaceholderImage label={label} />;
  return <Image src={url} alt="" fill sizes={sizes} style={{ objectFit: "cover" }} />;
}

export const generateMetadata = () => pageMetadata(
  "Books",
  "Books by Omini Nfawa — novels, essays and poetry, with purchase links to Selar, Amazon, Google Books and more.",
  "/books"
);
export const revalidate = 60;

export default async function BooksPage() {
  const { published, upcoming: upcomingBooks } = await getBooks();
  const featured = published.find((b) => b.featured) ?? published[0];
  const jsonLd = collectionPageSchema("Books", "/books", [...published, ...upcomingBooks].map((b) => b.title));

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...jsonLd }) }} />
      <Nav />
      <svg width="150" height="150" viewBox="0 0 150 150" style={css("position:absolute;right:32px;top:24px;pointer-events:none;")} aria-hidden="true">
        <g fill="var(--color-accent)" opacity="0.18">
          <circle cx="10" cy="10" r="2" /><circle cx="40" cy="10" r="2" /><circle cx="70" cy="10" r="2" /><circle cx="100" cy="10" r="2" /><circle cx="130" cy="10" r="2" />
          <circle cx="10" cy="40" r="2" /><circle cx="40" cy="40" r="2" /><circle cx="70" cy="40" r="2" /><circle cx="100" cy="40" r="2" /><circle cx="130" cy="40" r="2" />
          <circle cx="10" cy="70" r="2" /><circle cx="40" cy="70" r="2" /><circle cx="70" cy="70" r="2" /><circle cx="100" cy="70" r="2" /><circle cx="130" cy="70" r="2" />
        </g>
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>BOOKS</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Books</h1>
        <p style={css("margin:var(--space-3) 0 0;")}><a className="btn btn-secondary" href={AMAZON_AUTHOR_URL} target="_blank" rel="noopener noreferrer">Visit my Amazon author page</a></p>
      </section>

      {featured && (
        <>
          <div className="hr" />
          <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
            <div style={css("aspect-ratio:1/1;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:320px;")}>
              <BookCover url={featured.coverImageUrl} label="Book cover" sizes="(max-width: 700px) 90vw, 320px" />
            </div>
            <div style={css("flex:2 1 380px;display:flex;flex-direction:column;justify-content:center;")}>
              <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>FEATURED</div>
              <h2 style={css("font-family:var(--font-heading);font-size:36px;margin:0 0 var(--space-2);")}>{featured.title}</h2>
              <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}>{truncate(featured.excerpt)}</p>
              <Link href={`/books/${featured.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
            </div>
          </section>
        </>
      )}

      {upcomingBooks.length > 0 && (
        <>
          <div className="hr" />
          <section style={css("padding:var(--space-6);")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>UPCOMING</div>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space-6);")}>
              {upcomingBooks.map((b) => (
                <div key={b.slug}>
                  <div style={css("aspect-ratio:2/3;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);")}><BookCover url={b.coverImageUrl} label="Cover" sizes="180px" /></div>
                  <div style={css("font-family:var(--font-heading);font-size:18px;")}>{b.title}</div>
                  <div style={css("font-size:12px;opacity:0.55;")}>{b.kind} &middot; {b.year}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>PUBLISHED</div>
        {published.length === 0 ? (
          <EmptyState title="No books published yet." body="Nothing here yet. Please check back soon." />
        ) : (
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-4);")}>
          {published.map((b) => (
            <Link key={b.slug} href={`/books/${b.slug}`}>
              <div style={css("aspect-ratio:2/3;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);")}><BookCover url={b.coverImageUrl} label="Cover" sizes="160px" /></div>
              <div style={css("font-family:var(--font-heading);font-size:16px;")}>{b.title}</div>
              <div style={css("font-size:12px;opacity:0.55;")}>{b.year}</div>
            </Link>
          ))}
        </div>
        )}
      </section>

      <div className="hr" />

      <Footer />
    </div>
  );
}
