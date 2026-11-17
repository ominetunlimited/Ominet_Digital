import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EcosystemItem from "@/components/EcosystemItem";
import AdSlot from "@/components/AdSlot";
import NewsletterForm from "@/components/NewsletterForm";
import SocialLinks from "@/components/SocialLinks";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReadMoreExcerpt from "@/components/ReadMoreExcerpt";
import HeroSlideshow from "@/components/HeroSlideshow";
import PartnersStrip from "@/components/PartnersStrip";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import { getFeaturedBook, getArticles, getHeroSlides, getPartnerApps, getServices } from "@/lib/data";
import ArtCard from "@/components/ArtCard";
import { isPageOn } from "@/lib/site-pages";
import { getPersonSchema, getOrganizationSchema, jsonLdGraph, WEBSITE_ID, ORG_ID } from "@/lib/schema";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Ominet Digital",
  "A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.",
  "/"
);

export default async function Home() {
  const [featuredBook, articles, personSchema, { identity, homepage, pages }, heroSlides, partnerApps, services] = await Promise.all([
    getFeaturedBook(),
    getArticles(),
    getPersonSchema(),
    getSiteSettings(),
    getHeroSlides(),
    getPartnerApps(),
    getServices(),
  ]);
  const on = (k: string) => isPageOn(pages, k);
  const homeServices = services.filter((x) => x.featured).concat(services.filter((x) => !x.featured)).slice(0, 6);
  // A staff pick (Content admin -> Featured) wins; otherwise the newest
  // published piece, same as before.
  const logoUrl = identity.logoUrl;
  const latestArticle = articles.find((a) => a.featured) ?? articles[0];
  const heroArticles = homepage.showRecentWriting ? articles.slice(0, 3) : [];
  const jsonLd = jsonLdGraph([
    { "@type": "WebSite", "@id": WEBSITE_ID, name: SITE_NAME, url: SITE_URL, publisher: { "@id": ORG_ID } },
    getOrganizationSchema(SITE_NAME),
    personSchema,
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-teal-light);")}>
        <div style={css("max-width:1280px;margin:0 auto;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);display:flex;flex-wrap:wrap;min-height:520px;")}>
          <div style={css("flex:1 1 380px;background:var(--om-navy);color:#f1eefb;padding:var(--space-8);display:flex;flex-direction:column;justify-content:center;gap:var(--space-4);")}>
            <Image src={logoUrl || "/images/ominet-digital-logo.svg"} alt="Ominet Digital" width={72} height={70} priority style={css("display:block;height:70px;width:auto;")} />
            <div style={css("font-family:var(--font-heading);font-size:13px;letter-spacing:0.14em;color:var(--om-cyan);font-weight:800;")}>OMINI NFAWA</div>
            <h1 style={css("font-family:var(--font-heading);font-size:clamp(34px,4.5vw,48px);line-height:1.08;margin:0;color:#fff;")}>
              {homepage.heroHeading.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p style={css("font-size:16px;line-height:1.6;opacity:0.85;max-width:40ch;margin:0;")}>{homepage.heroSubheading}</p>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-2);")}>
              {on("writing") && <Link href="/writing"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Read the writing</button></Link>}
              {on("services") && <Link href="/services"><button type="button" className="btn btn-secondary" style={css("border-radius:var(--radius-md);border-color:rgba(255,255,255,0.4);color:#fff;")}>Our services</button></Link>}
              {on("about") && <Link href="/about"><button type="button" className="btn btn-secondary" style={css("border-radius:var(--radius-md);border-color:rgba(255,255,255,0.4);color:#fff;")}>About Omini</button></Link>}
            </div>
            {heroArticles.length > 0 && (
              <div style={css("margin-top:var(--space-3);")}>
                <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.6;margin-bottom:var(--space-2);")}>RECENT WRITING</div>
                <div style={css("display:grid;gap:6px;")}>
                  {heroArticles.map((a) => (
                    <Link key={a.slug} href={`/writing/${a.slug}`} style={css("font-size:14px;opacity:0.9;color:#f1eefb;")}>
                      {a.title} &rarr;
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div style={css("margin-top:var(--space-2);opacity:0.85;display:flex;align-items:center;gap:var(--space-3);")}>
              <SocialLinks />
              <WhatsAppButton />
            </div>
          </div>
          <div style={css("flex:1 1 380px;position:relative;min-height:320px;")}>
            <HeroSlideshow slides={heroSlides} fallbackImageUrl={homepage.heroImageUrl} />
          </div>
        </div>
      </section>

      <PartnersStrip apps={partnerApps} />

      <AdSlot slotKey="home_top" />

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>THE ECOSYSTEM</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-6);")}>
          {on("omini-nfawa") && (
          <EcosystemItem
            kicker="WRITER · RESEARCHER · MEDIA & COMMUNICATIONS"
            title="Omini Nfawa"
            description="Books, essays, fiction, research, film and photography from the ecosystem's founder."
            href="/omini-nfawa"
            cta="Explore Omini Nfawa"
          />
          )}
          {on("profile") && (
          <EcosystemItem
            kicker="PROFESSIONAL IDENTITY"
            title="PROFILE"
            description="A professional identity built from verified activity."
            href="/profile"
            cta="Explore Profile"
          />
          )}
          {on("media") && (
          <EcosystemItem
            kicker="VIDEO · PHOTOGRAPHY"
            title="Media"
            description="Video, photography and documentary work."
            href="/media"
            cta="Watch & view"
          />
          )}
          {on("cortexa-office") && (
          <EcosystemItem
            kicker="EMERGING PRODUCT"
            title="Cortexa Office"
            description="An emerging Ominet Digital product and office."
            href="/cortexa-office"
            cta="Learn more"
          />
          )}
        </div>
      </section>

      <AdSlot slotKey="home_middle" />

      <div className="hr" />

      {on("services") && homeServices.length > 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);")}>
          <div style={css("display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-5);")}>
            <div>
              <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-2);")}>WHAT WE DO</div>
              <h2 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,40px);margin:0;")}>One creative partner. Multiple professional solutions.</h2>
            </div>
            <Link href="/services" className="btn btn-secondary">All services</Link>
          </div>
          <div className="omd-grid">
            {homeServices.map((x, i) => (
              <ArtCard key={x.slug} href={`/services/${x.slug}`} kind="service" slug={x.slug} imageUrl={x.featuredImageUrl} kicker={`${String(i + 1).padStart(2, "0")}${x.category ? " · " + x.category : ""}`} title={x.title} description={x.shortDescription} cta="Explore service" />
            ))}
          </div>
        </section>
      )}


      <div className="hr" />

      {on("books") && featuredBook && (
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
            <ReadMoreExcerpt
              text={featuredBook.excerpt}
              style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}
            />
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <Link href={`/books/${featuredBook.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
              <Link href={`/books/${featuredBook.slug}`}>Where to buy &rarr;</Link>
            </div>
          </div>
        </section>
      )}

      <div className="hr" />

      {on("writing") && latestArticle && (
        <section style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
          <Link href={`/writing/${latestArticle.slug}`} style={css("display:block;")}>
            <div className="card">
              <div className="card-kicker">{latestArticle.featured ? "FEATURED WRITING" : "LATEST WRITING"}</div>
              <div className="card-title">{latestArticle.title}</div>
              <ReadMoreExcerpt text={latestArticle.excerpt} className="card-body" />
              <div className="card-meta"><span>{latestArticle.date}</span></div>
            </div>
          </Link>
        </section>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#f1eefb;")}>
        <div style={css("max-width:640px;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-cyan);margin-bottom:var(--space-3);")}>PROFILE</div>
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
