import RichText from "@/components/RichText";
import { splitRichBlocks } from "@/lib/rich-text";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { ResearchProfileSection } from "@/components/ResearchProfileLinks";
import { getSelectedWork } from "@/lib/selected-work";
import { getPersonSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { getSiteSettings } from "@/lib/site-settings";

export const generateMetadata = () => pageMetadata(
  "Founder: Omini Nfawa",
  "Omini Nfawa is a Nigerian writer, researcher and media and communications specialist whose work moves between literature, research, storytelling and Nigeria's everyday realities.",
  "/founder"
);

export default async function AboutPage() {
  const [work, personSchema, { about }] = await Promise.all([getSelectedWork(), getPersonSchema(), getSiteSettings()]);
  const bioBlocks = splitRichBlocks(about.bio);
  const jsonLd = jsonLdGraph([
    personSchema,
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Founder", path: "/founder" }]),
  ]);
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <svg width="300" height="300" viewBox="0 0 300 300" style={css("position:absolute;right:-90px;top:20px;pointer-events:none;")} aria-hidden="true">
        <circle cx="150" cy="150" r="149" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.18" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:3/4;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 260px;max-width:360px;")}>
          <Image src={about.photoUrl || "/images/omi-nfawa.jpg"} alt="Omini Nfawa" fill sizes="(max-width: 700px) 90vw, 360px" style={{ objectFit: "cover" }} priority />
        </div>
        <div style={css("flex:2 1 380px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>THE FOUNDER</div>
          <h1 style={css("font-family:var(--font-heading);font-size:44px;margin:0 0 var(--space-2);")}>Omini Nfawa</h1>
          <div style={css("font-size:13px;letter-spacing:0.06em;opacity:0.6;margin-bottom:var(--space-4);text-transform:uppercase;")}>{about.tagline}</div>
          {about.intro && (
            <p style={css("font-size:17px;line-height:1.7;opacity:0.85;max-width:60ch;margin:0 0 var(--space-3);font-style:italic;")}>
              {about.intro}
            </p>
          )}
          <RichText html={bioBlocks.slice(0, 2).join("")} style={css("font-size:16px;line-height:1.7;opacity:0.8;max-width:60ch;")} />
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);max-width:760px;")}>
        <RichText html={bioBlocks.slice(2).join("")} style={css("font-size:16px;line-height:1.75;opacity:0.8;")} />
      </section>

      <div className="hr" />

      {work.length > 0 && (
        <section style={css("padding:var(--space-8) var(--space-6);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>SELECTED WORK</div>
          <div style={css("display:grid;gap:var(--space-4);")}>
            {work.map((w, i) => (
              <div
                key={w.id}
                style={css(
                  `display:flex;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap;${i < work.length - 1 ? "border-bottom:2px solid var(--color-divider);" : ""}padding-bottom:var(--space-3);`
                )}
              >
                <span>{w.label}</span><span style={css("opacity:0.55;")}>{w.yearLabel}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ResearchProfileSection placement="profile" />

      <div className="hr" />
      <Footer />
    </div>
  );
}
