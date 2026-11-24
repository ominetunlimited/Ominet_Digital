import { getReadCounts } from "@/lib/reads";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EcosystemCard from "@/components/cards/EcosystemCard";
import ArticleCard from "@/components/cards/ArticleCard";
import AdSlot from "@/components/AdSlot";
import Geo from "@/components/Geo";
import NewsletterForm from "@/components/NewsletterForm";
import SocialLinks from "@/components/SocialLinks";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReadMoreExcerpt from "@/components/ReadMoreExcerpt";
import HeroSlideshow from "@/components/HeroSlideshow";
import PartnersStrip from "@/components/PartnersStrip";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import { getFeaturedBooks, getArticles, getHeroSlides, getPartnerApps, getServices } from "@/lib/data";
import ArtCard from "@/components/ArtCard";
import { isPageOn } from "@/lib/site-pages";
import { getPersonSchema, getOrganizationSchema, jsonLdGraph, WEBSITE_ID, ORG_ID } from "@/lib/schema";
import { getSiteSettings } from "@/lib/site-settings";
import BlogCard from "@/components/cards/BlogCard";
import { getBlogIndex, fmtDate, readLabel } from "@/lib/blog";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Ominet Digital",
  "Ominet Digital is a Nigerian digital company working across publishing, media production, design, technology and professional services.",
  "/"
);

export default async function Home() {
  const [featuredBooks, articles, personSchema, { identity, homepage, pages, ecosystem }, heroSlides, partnerApps, services, blogLatest] = await Promise.all([
    getFeaturedBooks(2),
    getArticles(),
    getPersonSchema(),
    getSiteSettings(),
    getHeroSlides(),
    getPartnerApps(),
    getServices(),
    getBlogIndex({ page: 1 }),
  ]);
  const on = (k: string) => isPageOn(pages, k);
  const homeServices = services.filter((x) => x.featured).concat(services.filter((x) => !x.featured)).slice(0, 6);
  // A staff pick (Content admin -> Featured) wins; otherwise the newest
  // published piece, same as before.
  const logoUrl = identity.logoUrl;
  const featuredArticles = [...articles.filter((a) => a.featured), ...articles.filter((a) => !a.featured)].slice(0, 2);
  const latestPosts = blogLatest.posts.slice(0, 4);
  const [blogReads, articleReads] = await Promise.all([getReadCounts("blog", latestPosts.map((p) => p.slug)), getReadCounts("articles", featuredArticles.map((a) => a.slug))]);
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
          <div style={css("flex:1 1 380px;background:var(--om-navy);color:#f1eefb;padding:var(--space-8);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:var(--space-4);position:relative;overflow:hidden;")}>
            <Geo variant="lattice" size={360} opacity={0.22} style={{ right: -90, top: -70 }} />
            <Geo variant="orbit" size={220} color="#7fd6ee" opacity={0.18} style={{ left: -70, bottom: -60 }} />
            <Image src={logoUrl || "/images/ominet-digital-logo.svg"} alt="Ominet Digital" width={72} height={70} priority style={css("display:block;height:70px;width:auto;")} />
            <div style={css("font-family:var(--font-heading);font-size:clamp(32px,4vw,46px);letter-spacing:0.1em;color:#fff;font-weight:900;line-height:1;margin-top:calc(var(--space-2) * -1);")}>OMINET DIGITAL</div>
            <h1 style={css("font-family:var(--font-heading);font-size:clamp(20px,2.4vw,30px);line-height:1.3;font-weight:400;letter-spacing:0.01em;margin:0;color:#e4def7;max-width:28ch;")}>
              {homepage.heroHeading.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p style={css("font-size:16px;line-height:1.6;opacity:0.85;max-width:44ch;margin:0;")}>{homepage.heroSubheading}</p>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;justify-content:center;margin-top:var(--space-2);")}>
              {on("services") && <Link href="/services"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Explore Our Services</button></Link>}
              <Link href={on("media") ? "/media" : on("books") ? "/books" : "/discuss-a-project"}><button type="button" className="btn btn-secondary" style={css("border-radius:var(--radius-md);border-color:rgba(255,255,255,0.4);color:#fff;")}>Explore Our Work</button></Link>
              </div>
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

      {on("books") && featuredBooks.length > 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);position:relative;overflow:hidden;")}>
          <Geo variant="facets" size={300} opacity={0.2} style={{ right: -60, top: -40 }} />
          <div style={css("display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-5);")}>
            <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;")}>BOOKS AND PUBLISHING</div>
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;")}>
              <Link href="/books" className="btn btn-secondary">Browse all books</Link>
            </div>
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:var(--space-8);position:relative;")}>
            {featuredBooks.map((b) => (
              <div key={b.slug} style={css("display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-5);")}>
                <div style={css("aspect-ratio:1/1;position:relative;flex:1 1 150px;max-width:200px;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-md);")}>
                  {b.coverImageUrl ? (
                    <Image src={b.coverImageUrl} alt="" fill sizes="(max-width: 700px) 60vw, 200px" style={{ objectFit: "cover" }} />
                  ) : (
                    <PlaceholderImage label="Book cover" />
                  )}
                </div>
                <div style={css("flex:2 1 220px;display:flex;flex-direction:column;justify-content:center;")}>
                  <h2 style={css("font-family:var(--font-heading);font-size:clamp(24px,2.6vw,30px);margin:0 0 var(--space-2);")}>{b.title}</h2>
                  <ReadMoreExcerpt text={b.excerpt} style={css("font-size:15px;line-height:1.65;opacity:0.75;max-width:48ch;margin:0 0 var(--space-4);")} />
                  <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;")}>
                    <Link href={`/books/${b.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
                    <Link href={`/books/${b.slug}`}>Where to buy &rarr;</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdSlot slotKey="home_top" />

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

      <section style={css("padding:var(--space-6) var(--space-6) var(--space-8);")}>
        <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-4);")}>MAIN BUSINESS AREAS</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-5);")}>
          {[
            ["Publishing", "Books, manuscripts, formats and promotion.", "/books"],
            ["Creative production", "Video, photography, graphic and presentation design.", "/media"],
            ["Professional services", "Writing, research support, business registration and related services.", "/services"],
            ["Technology and platforms", "Digital products built and run by Ominet Digital.", "/profile"],
            ["Editorial", "A blog for timely posts and a separate home for long-form articles.", "/blog"],
          ].map(([t, d, h]) => (
            <Link key={t} href={h} style={css("display:block;border-top:2px solid var(--om-cyan);padding-top:var(--space-3);")}>
              <div style={css("font-family:var(--font-heading);font-size:18px;margin-bottom:6px;")}>{t}</div>
              <div style={css("font-size:14px;line-height:1.6;opacity:0.7;")}>{d}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="hr" />

      {on("blog") && latestPosts.length > 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);")}>
          <div style={css("display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-5);")}>
            <div>
              <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-2);")}>FROM THE BLOG</div>
              <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0;")}>Latest writing</h2>
            </div>
            <Link href="/blog" className="btn btn-secondary">All blog posts</Link>
          </div>
          <div className="bl-grid">
            {latestPosts.map((p) => <BlogCard key={p.id} href={`/blog/${p.slug}`} title={p.title} excerpt={p.excerpt || p.dek} category={p.category?.name} date={fmtDate(p.publishedAt)} readTime={readLabel(p.readMinutes)} author={p.authorName} imageUrl={p.featuredImageUrl} imageAlt={p.featuredImageAlt} reads={blogReads[p.slug] ?? 0} />)}
          </div>
        </section>
      )}

      {on("blog") && latestPosts.length > 0 && <div className="hr" />}

      {on("writing") && featuredArticles.length > 0 && (
        <section style={css("padding:var(--space-6) var(--space-6);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{featuredArticles.some((a) => a.featured) ? "FEATURED ARTICLES" : "LATEST ARTICLES"}</div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:var(--space-6);")}>
            {featuredArticles.map((a) => (
              <ArticleCard key={a.slug} href={`/articles/${a.slug}`} title={a.title} excerpt={a.excerpt} category={a.category} subcategory={a.subcategory}
                date={a.date} readTime={a.readTime} imageUrl={a.featuredImageUrl} reads={articleReads[a.slug] ?? 0} />
            ))}
          </div>
          <div style={css("margin-top:var(--space-3);")}><Link href="/articles">Browse all articles &rarr;</Link></div>
        </section>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);position:relative;overflow:hidden;")}>
        <Geo variant="grid" size={280} color="var(--om-azure)" opacity={0.16} style={{ right: -40, top: 10 }} />
        <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-2);")}>WHY OMINET DIGITAL</div>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0 0 var(--space-5);max-width:24ch;")}>Ideas, words, research and visual media in one considered process.</h2>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-6);")}>
          {[
            ["Integrated expertise", "Writing, editing, research, design and multimedia are treated as connected parts of one project."],
            ["Books and publishing", "Manuscript development, interiors, digital formats, print specifications and promotional material."],
            ["Research with integrity", "Credible sources, accurate attribution and honest representation of evidence."],
            ["Ready for use", "Correct files, clean sound, readable slides. The practical details that make work ready to serve its purpose."],
          ].map(([t, d]) => (
            <div key={t} style={css("border-top:2px solid var(--om-cyan);padding-top:var(--space-3);")}>
              <div style={css("font-family:var(--font-heading);font-size:18px;margin-bottom:6px;")}>{t}</div>
              <div style={css("font-size:14px;line-height:1.6;opacity:0.7;")}>{d}</div>
            </div>
          ))}
        </div>
        <div style={css("margin-top:var(--space-5);")}><Link href="/discuss-a-project" className="btn btn-primary">Discuss a project</Link></div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>PLATFORMS AND PRODUCTS</div>
        <div className="eco-grid">
          {on("omini-nfawa") && <EcosystemCard id="omini-nfawa" index={0} kicker="WRITER · RESEARCHER · MEDIA & COMMUNICATIONS" title="Omini Nfawa" description="Books, essays, fiction, research, film and photography from the ecosystem's founder." href="/omini-nfawa" cta="Explore Omini Nfawa" />}
          {on("profile") && <EcosystemCard id="profile" index={1} kicker="PROFESSIONAL IDENTITY" title="PROFILE" description="A professional identity built from verified activity." href="/profile" cta="Explore Profile" />}
          {on("media") && <EcosystemCard id="media" index={2} kicker="VIDEO · PHOTOGRAPHY" title="Media" description="Video, photography and documentary work." href="/media" cta="Watch & view" />}
          {on("cortexa-office") && <EcosystemCard id="cortexa-office" index={3} kicker="EMERGING PRODUCT" title="Cortexa Office" description="An emerging Ominet Digital product and office." href="/cortexa-office" cta="Learn more" />}
        </div>
      </section>

      <PartnersStrip apps={partnerApps} />

      <AdSlot slotKey="home_middle" />

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#f1eefb;position:relative;overflow:hidden;")}>
        <Geo variant="lattice" size={300} opacity={0.2} style={{ right: -70, top: -60 }} />
        <div style={css("max-width:640px;position:relative;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-cyan);margin-bottom:var(--space-3);")}>PROFILE{!ecosystem.profileVisible && " · IN DEVELOPMENT"}</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);color:#fff;")}>Your professional identity should be more than a CV.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.85;margin:0 0 var(--space-4);")}>Activity, verification and attribution, built into one identity you carry between opportunities.</p>
          <Link href="/profile"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>{ecosystem.profileVisible ? "Explore Profile" : "Find out more"}</button></Link>
        </div>
      </section>

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#f1eefb;position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,0.12);")}>
        <Geo variant="orbit" size={300} opacity={0.2} style={{ right: -70, top: -60 }} />
        <div style={css("max-width:640px;position:relative;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-cyan);margin-bottom:var(--space-3);")}>START A PROJECT</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);color:#fff;")}>Tell us what you are working on.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.85;margin:0 0 var(--space-4);")}>Send a project enquiry and we will respond with the next steps, or reach us directly by email or WhatsApp.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            <Link href="/discuss-a-project"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Discuss a project</button></Link>
            <Link href="/contact"><button type="button" className="btn btn-secondary" style={css("border-radius:var(--radius-md);border-color:rgba(255,255,255,0.4);color:#fff;")}>Contact us</button></Link>
          </div>
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
