import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EcosystemItem from "@/components/EcosystemItem";
import AdSlot from "@/components/AdSlot";
import NewsletterForm from "@/components/NewsletterForm";
import SocialLinks from "@/components/SocialLinks";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import { getFeaturedBook, getLatestArticle } from "@/lib/data";
import { truncate } from "@/lib/text";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Ominet Digital",
  "A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.",
  "/"
);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default async function Home() {
  const [featuredBook, latestArticle] = await Promise.all([getFeaturedBook(), getLatestArticle()]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-teal-light);")}>
        <div style={css("max-width:1280px;margin:0 auto;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);display:flex;flex-wrap:wrap;min-height:520px;")}>
          <div style={css("flex:1 1 380px;background:var(--om-navy);color:#eafaf0;padding:var(--space-8);display:flex;flex-direction:column;justify-content:center;gap:var(--space-4);")}>
            <Image src="/images/ominet-digital-logo.svg" alt="Ominet Digital" width={64} height={49} priority style={css("display:block;")} />
            <div style={css("font-family:var(--font-heading);font-size:13px;letter-spacing:0.14em;color:var(--om-orange);font-weight:800;")}>OMINET DIGITAL</div>
            <h1 style={css("font-family:var(--font-heading);font-size:clamp(38px,5vw,56px);line-height:1.05;margin:0;color:#fff;")}>Ideas. Stories.<br />Creative Work.</h1>
            <p style={css("font-size:16px;line-height:1.6;opacity:0.85;max-width:40ch;margin:0;")}>A digital ecosystem for publishing, professional identity and technology &mdash; built by Omini Nfawa.</p>
            <div style={css("display:flex;gap:var(--space-2);margin-top:var(--space-2);")}>
              <input type="text" className="input" placeholder="Search the ecosystem" style={css("flex:1;border-radius:var(--radius-md);border:none;")} />
              <button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")} aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div style={css("margin-top:var(--space-2);opacity:0.85;")}>
              <SocialLinks />
            </div>
          </div>
          <div style={css("flex:1 1 380px;position:relative;min-height:320px;")}>
            <Image
              src="/images/hero-home.jpg"
              alt="A student working at a laptop, taking notes by hand"
              fill
              sizes="(max-width: 900px) 100vw, 640px"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>
      </section>

      <AdSlot slotKey="home_top" />

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>THE ECOSYSTEM</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-6);")}>
          <EcosystemItem
            kicker="WRITER · RESEARCHER · MEDIA & COMMUNICATIONS"
            title="Omini Nfawa"
            description="Books, essays, fiction, research, film and photography from the ecosystem's founder."
            href="/omini-nfawa"
            cta="Explore Omini Nfawa"
          />
          <EcosystemItem
            kicker="PROFESSIONAL IDENTITY"
            title="PROFILE"
            description="A professional identity built from verified activity."
            href="/profile"
            cta="Explore Profile"
          />
          <EcosystemItem
            kicker="VIDEO · PHOTOGRAPHY"
            title="Media"
            description="Video, photography and documentary work."
            href="/media"
            cta="Watch & view"
          />
          <EcosystemItem
            kicker="EMERGING PRODUCT"
            title="Cortexa Office"
            description="An emerging Ominet Digital product and office."
            href="/cortexa-office"
            cta="Learn more"
          />
        </div>
      </section>

      <AdSlot slotKey="home_middle" />

      <div className="hr" />

      {featuredBook && (
        <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
          <div style={css("aspect-ratio:1/1;position:relative;flex:1 1 240px;max-width:320px;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-md);")}>
            {featuredBook.coverImageUrl ? (
              <Image src={featuredBook.coverImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 320px" style={{ objectFit: "cover" }} />
            ) : (
              <PlaceholderImage label="Book cover" />
            )}
          </div>
          <div style={css("flex:2 1 380px;display:flex;flex-direction:column;justify-content:center;")}>
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>FEATURED BOOK &middot; OMINI NFAWA</div>
            <h2 style={css("font-family:var(--font-heading);font-size:36px;margin:0 0 var(--space-2);")}>{featuredBook.title}</h2>
            <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}>{truncate(featuredBook.excerpt)}</p>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <Link href={`/books/${featuredBook.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
              <Link href={`/books/${featuredBook.slug}`}>Where to buy &rarr;</Link>
            </div>
          </div>
        </section>
      )}

      <div className="hr" />

      {latestArticle && (
        <section style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
          <Link href={`/writing/${latestArticle.slug}`} style={css("display:block;")}>
            <div className="card">
              <div className="card-kicker">LATEST WRITING</div>
              <div className="card-title">{latestArticle.title}</div>
              <p className="card-body">{truncate(latestArticle.excerpt, 160)}</p>
              <div className="card-meta"><span>{latestArticle.date}</span></div>
            </div>
          </Link>
        </section>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#eafaf0;")}>
        <div style={css("max-width:640px;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-orange);margin-bottom:var(--space-3);")}>PROFILE</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);color:#fff;")}>Your professional identity should be more than a CV.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.85;margin:0 0 var(--space-4);")}>Activity, verification and attribution &mdash; built into one identity you carry between opportunities.</p>
          <Link href="/profile"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Explore Profile</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>CORTEXA OFFICE</div>
        <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
          <div style={css("font-family:var(--font-heading);font-size:26px;max-width:44ch;")}>An emerging office and product within Ominet Digital.</div>
          <Link href="/cortexa-office"><button type="button" className="btn btn-secondary">Learn more</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;justify-content:space-between;align-items:center;gap:var(--space-6);flex-wrap:wrap;")}>
        <div style={css("flex:1 1 260px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>NEWSLETTER</div>
          <div style={css("font-family:var(--font-heading);font-size:24px;")}>News from across the ecosystem, occasionally.</div>
        </div>
        <NewsletterForm />
      </section>

      <Footer />
    </div>
  );
}
