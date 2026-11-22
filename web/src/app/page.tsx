import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import { AMAZON_AUTHOR_URL } from "@/lib/links";
import EcosystemCard from "@/components/cards/EcosystemCard";
import ArticleCard from "@/components/cards/ArticleCard";
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
import BlogCard from "@/components/cards/BlogCard";
import { getBlogIndex, fmtDate, readLabel } from "@/lib/blog";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Ominet Digital",
  "Ominet Digital is a Nigerian digital company working across publishing, media production, design, technology and professional services.",
  "/"
);

export default async function Home() {
  const [featuredBook, articles, personSchema, { identity, homepage, pages }, heroSlides, partnerApps, services, blogLatest] = await Promise.all([
    getFeaturedBook(),
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
  const latestArticle = articles.find((a) => a.featured) ?? articles[0];
  const latestPosts = blogLatest.posts.slice(0, 3);
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
            <div style={css("font-family:var(--font-heading);font-size:clamp(28px,3.6vw,40px);letter-spacing:0.1em;color:#fff;font-weight:900;line-height:1;margin-top:calc(var(--space-2) * -1);")}>OMINET DIGITAL</div>
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

      <AdSlot slotKey="home_top" />

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);align-items:start;")}>
        <div>
          <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-2);")}>ABOUT OMINET DIGITAL</div>
          <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0;max-width:20ch;")}>A digital company built around making and publishing real work.</h2>
        </div>
        <div style={css("font-size:16px;line-height:1.7;opacity:0.8;")}>
          <p style={css("margin:0 0 var(--space-3);")}>We publish books and written work, produce design, photography and video, build digital tools, and handle selected business and documentation services. Whether you arrive with a manuscript, a brand to shape or a project to scope, we start by understanding what you need and agree the work before it begins.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            {on("ominet-digital") && <Link href="/ominet-digital">Studio and capabilities &rarr;</Link>}
            <Link href="/contact">Contact us &rarr;</Link>
          </div>
        </div>
      </section>

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
            <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>BOOKS AND PUBLISHING</div>
            <h2 style={css("font-family:var(--font-heading);font-size:36px;margin:0 0 var(--space-2);")}>{featuredBook.title}</h2>
            <ReadMoreExcerpt
              text={featuredBook.excerpt}
              style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:52ch;margin:0 0 var(--space-4);")}
            />
            <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
              <Link href={`/books/${featuredBook.slug}`}><button type="button" className="btn btn-primary">View book</button></Link>
              <Link href={`/books/${featuredBook.slug}`}>Where to buy &rarr;</Link>
              <a href={AMAZON_AUTHOR_URL} target="_blank" rel="noopener noreferrer">Find my books on Amazon &rarr;</a>
            </div>
          </div>
        </section>
      )}

      <div className="hr" />

      {on("blog") && latestPosts.length > 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);")}>
          <div style={css("display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-5);")}>
            <div>
              <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-2);")}>FROM THE BLOG</div>
              <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0;")}>Latest posts</h2>
            </div>
            <Link href="/blog" className="btn btn-secondary">All blog posts</Link>
          </div>
          <div className="bl-grid">
            {latestPosts.map((p) => <BlogCard key={p.id} href={`/blog/${p.slug}`} title={p.title} excerpt={p.excerpt || p.dek} category={p.category?.name} date={fmtDate(p.publishedAt)} readTime={readLabel(p.readMinutes)} author={p.authorName} imageUrl={p.featuredImageUrl} imageAlt={p.featuredImageAlt} />)}
          </div>
        </section>
      )}

      {on("blog") && latestPosts.length > 0 && <div className="hr" />}

      {on("writing") && latestArticle && (
        <section style={css("padding:var(--space-6) var(--space-6);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>{latestArticle.featured ? "FEATURED ARTICLE" : "LATEST ARTICLE"}</div>
          <ArticleCard variant="lead" href={`/articles/${latestArticle.slug}`} title={latestArticle.title} excerpt={latestArticle.excerpt} category={latestArticle.category} subcategory={latestArticle.subcategory}
            date={latestArticle.date} readTime={latestArticle.readTime} imageUrl={latestArticle.featuredImageUrl} />
          <div style={css("margin-top:var(--space-3);")}><Link href="/articles">Browse all articles &rarr;</Link></div>
        </section>
      )}

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
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

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#f1eefb;")}>
        <div style={css("max-width:640px;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.08em;color:var(--om-cyan);margin-bottom:var(--space-3);")}>PROFILE</div>
          <h2 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);color:#fff;")}>Your professional identity should be more than a CV.</h2>
          <p style={css("font-size:16px;line-height:1.7;opacity:0.85;margin:0 0 var(--space-4);")}>Activity, verification and attribution, built into one identity you carry between opportunities.</p>
          <Link href="/profile"><button type="button" className="btn btn-primary" style={css("border-radius:var(--radius-md);")}>Explore Profile</button></Link>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-6);justify-content:space-between;align-items:center;")}>
        <div style={css("flex:1 1 320px;max-width:60ch;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>THE FOUNDER</div>
          <p style={css("font-family:var(--font-heading);font-size:22px;line-height:1.4;margin:0 0 var(--space-3);")}>Ominet Digital was founded by Omini Nfawa Eyong, a Nigerian writer, researcher and media professional.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            {on("founder") && <Link href="/founder">Read the founder&apos;s profile &rarr;</Link>}
            <a href={AMAZON_AUTHOR_URL} target="_blank" rel="noopener noreferrer">Find my books on Amazon &rarr;</a>
          </div>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-navy);color:#f1eefb;")}>
        <div style={css("max-width:640px;")}>
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
