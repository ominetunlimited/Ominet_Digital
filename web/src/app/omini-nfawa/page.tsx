import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import NewsletterForm from "@/components/NewsletterForm";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getFeaturedBook, getArticles } from "@/lib/data";
import { truncate } from "@/lib/text";

export const metadata = pageMetadata(
  "Omini Nfawa",
  "Essays, research and fiction, alongside books, film and photography from Omini Nfawa.",
  "/omini-nfawa"
);
export const revalidate = 60;

export default async function OminiNfawaPage() {
  const [featuredBook, articles] = await Promise.all([getFeaturedBook(), getArticles()]);
  const featuredArticle = articles[0];
  const secondArticle = articles[1];
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;")}>
      <Nav />

      <section style={css("position:relative;padding:var(--space-8) var(--space-6) calc(var(--space-8) * 1.4);overflow:hidden;")}>
        <svg width="520" height="520" viewBox="0 0 520 520" style={css("position:absolute;top:-140px;right:-120px;pointer-events:none;")} aria-hidden="true">
          <circle cx="260" cy="260" r="259" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.18" />
          <circle cx="260" cy="260" r="180" fill="none" stroke="var(--color-text)" strokeWidth="1" opacity="0.12" />
          <circle cx="260" cy="260" r="100" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.14" />
        </svg>
        <svg width="180" height="420" style={css("position:absolute;left:var(--space-6);bottom:0;pointer-events:none;")} aria-hidden="true">
          <line x1="8" y1="0" x2="8" y2="420" stroke="var(--color-text)" strokeWidth="1" opacity="0.08" />
          <line x1="40" y1="0" x2="40" y2="420" stroke="var(--color-text)" strokeWidth="1" opacity="0.08" />
          <line x1="72" y1="0" x2="72" y2="420" stroke="var(--color-text)" strokeWidth="1" opacity="0.08" />
        </svg>
        <div style={css("position:relative;max-width:840px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>OMINI NFAWA WITHIN OMINET DIGITAL</div>
          <div style={css("font-family:var(--font-body);font-size:12px;letter-spacing:0.14em;opacity:0.55;margin-bottom:var(--space-4);")}>WRITER &middot; RESEARCHER &middot; CREATIVE &middot; FILMMAKER &middot; EDUCATOR</div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(48px,7vw,96px);line-height:0.98;font-weight:700;margin:0 0 var(--space-4);letter-spacing:-0.01em;")}>Omini Nfawa</h1>
          <p style={css("font-size:20px;line-height:1.5;max-width:56ch;opacity:0.8;margin:0 0 var(--space-6);")}>Essays, research and fiction, alongside books, film and photography &mdash; and the studio and platform built to carry them further.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            <Link href="/writing"><button type="button" className="btn btn-primary">Read the latest writing</button></Link>
            <Link href="/books"><button type="button" className="btn btn-secondary">Browse books</button></Link>
          </div>
        </div>
      </section>

      <div className="hr" />

      {featuredArticle && (
        <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-8);align-items:center;")}>
          <div style={css("flex:2 1 380px;")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>FEATURED WRITING</div>
            <h2 style={css("font-family:var(--font-heading);font-size:36px;line-height:1.15;margin:0 0 var(--space-3);")}>{featuredArticle.title}</h2>
            <p style={css("font-size:16px;line-height:1.7;opacity:0.75;margin:0 0 var(--space-4);")}>{featuredArticle.excerpt}</p>
            <div style={css("display:flex;gap:var(--space-3);align-items:center;font-size:12px;opacity:0.6;margin-bottom:var(--space-4);")}>
              <span className="tag tag-neutral">{featuredArticle.category}</span>
              <span>{featuredArticle.date}</span>
              <span>&middot;</span>
              <span>{featuredArticle.readTime} read</span>
            </div>
            <Link href={`/writing/${featuredArticle.slug}`}>Read the essay &rarr;</Link>
          </div>
          <div style={css("aspect-ratio:4/3;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 320px;")}>
            {featuredArticle.featuredImageUrl ? (
              <Image src={featuredArticle.featuredImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 400px" style={{ objectFit: "cover" }} />
            ) : (
              <PlaceholderImage label="Essay image" />
            )}
          </div>
        </section>
      )}

      <div className="hr" />

      {featuredBook && (
        <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
          <div style={css("aspect-ratio:1/1;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:320px;")}>
            {featuredBook.coverImageUrl ? (
              <Image src={featuredBook.coverImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 320px" style={{ objectFit: "cover" }} />
            ) : (
              <PlaceholderImage label="Book cover" />
            )}
          </div>
          <div style={css("flex:2 1 380px;display:flex;flex-direction:column;justify-content:center;")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>FEATURED BOOK</div>
            <h2 style={css("font-family:var(--font-heading);font-size:36px;margin:0 0 var(--space-2);")}>{featuredBook.title}</h2>
            <div style={css("font-size:14px;opacity:0.6;margin-bottom:var(--space-3);")}>{featuredBook.kind} &middot; Omini Nfawa</div>
            <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}>{truncate(featuredBook.excerpt)}</p>
            {featuredBook.formats.length > 0 && (
              <div style={css("display:flex;gap:var(--space-2);margin-bottom:var(--space-4);")}>
                {featuredBook.formats.map((f) => <span key={f} className="tag tag-outline">{f}</span>)}
              </div>
            )}
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <Link href={`/books/${featuredBook.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
              <Link href={`/books/${featuredBook.slug}`}>Where to buy &rarr;</Link>
            </div>
          </div>
        </section>
      )}

      <div className="hr" />

      {secondArticle && (
        <>
          <section style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
            <Link href={`/writing/${secondArticle.slug}`} style={css("display:block;")}>
              <div className="card">
                <div className="card-kicker">LATEST ESSAY</div>
                <div className="card-title">{secondArticle.title}</div>
                <p className="card-body">{secondArticle.excerpt}</p>
                <div className="card-meta"><span>{secondArticle.date}</span></div>
              </div>
            </Link>
          </section>

          <div className="hr" />
        </>
      )}

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--color-text);color:var(--color-bg);")}>
        <div style={css("max-width:640px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.6;margin-bottom:var(--space-3);")}>OMINET DIGITAL</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);")}>The studio behind the work.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.8;margin:0 0 var(--space-4);")}>Video, photography, design and digital publishing &mdash; for Omini&apos;s own projects and for clients.</p>
          <Link href="/ominet-digital"><button type="button" className="btn btn-secondary" style={css("border-color:var(--color-bg);color:var(--color-bg);")}>Visit Ominet Digital</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);position:relative;overflow:hidden;")}>
        <svg width="360" height="360" viewBox="0 0 360 360" style={css("position:absolute;right:-80px;top:-80px;pointer-events:none;")} aria-hidden="true">
          <circle cx="180" cy="180" r="179" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.25" />
          <circle cx="180" cy="180" r="120" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.18" />
        </svg>
        <div style={css("max-width:640px;position:relative;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;letter-spacing:0.08em;font-weight:700;margin-bottom:var(--space-3);")}>PROFILE</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);")}>Your professional identity should be more than a CV.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.75;margin:0 0 var(--space-4);")}>Activity, verification and attribution &mdash; built into one identity you carry between opportunities.</p>
          <Link href="/profile"><button type="button" className="btn btn-primary">Explore Profile</button></Link>
        </div>
      </section>

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
