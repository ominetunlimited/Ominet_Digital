import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { ResearchProfileSection } from "@/components/ResearchProfileLinks";
import { getSelectedWork } from "@/lib/selected-work";
import { getPersonSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";

const TAGLINE = "Writer · Researcher · Media & Communications Specialist";

export const generateMetadata = () => pageMetadata(
  "About",
  "Omini Nfawa is a Nigerian writer, researcher and media and communications specialist whose work moves between literature, research, storytelling and Nigeria's everyday realities.",
  "/about"
);

const BIO = [
  "Omini Nfawa is a Nigerian writer, researcher and media and communications specialist whose work moves between literature, research, storytelling and the everyday business of trying to make sense of Nigeria.",
  "He studied English and Literary Studies, which probably explains why he has spent a considerable amount of time arguing with sentences, stories and ideas. Writing came naturally. Media came with it. Technology arrived later and, rather than being politely ignored, became an adventure of its own.",
  "His work lives mainly in three places: writing, media, and digital innovation.",
  "As a writer, Omini works across fiction, essays, literary criticism, research and social commentary. His interests often circle around power, identity, inequality, childhood, culture, society and the strange ways ordinary people find themselves inside much bigger stories.",
  "His published and completed works include an analysis of Florence Oketona's Ashes in the Times, The Dual Edge of Religion, and An Analysis of the Representation of Violence Against the Male Child in African Fiction. The latter research also helped inspire his novel, A Child's Cry in the Savannah.",
  "He is also working on a growing body of social and political writing, including Our Politicians Have Gone Mad Again, Things Are Getting Out of Hand, and The Slow Funeral of Nigeria's Institutions, among other works.",
  "Media is another part of the same instinct. Omini works with video, photography, documentary storytelling, visual communication and creative production. For him, a camera is not simply a piece of equipment. It is another way of asking questions, noticing things and occasionally catching something that words would have missed.",
  "Technology is the newer adventure. Through Ominet Digital, he explores digital publishing, websites, software, creative technology and new ways of organising ideas and professional identity. PROFILE, for example, grew from an interest in how people can build a professional identity from the work they actually do, rather than endlessly rewriting the same CV.",
  "Ominet Digital is where these interests meet: writing, research, media, publishing, technology and creative work.",
  "There is no neat formula behind all of it. Omini is interested in ideas, but also in making things. He can spend hours thinking about a literary theory and then get distracted by a website that needs fixing. He likes books, cameras, good arguments, useful technology and stories that leave something behind after the last page.",
  "There is always a story behind the story. And this is where he keeps some of them.",
];

export default async function AboutPage() {
  const [work, personSchema] = await Promise.all([getSelectedWork(), getPersonSchema()]);
  const jsonLd = jsonLdGraph([
    personSchema,
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]),
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
          <Image src="/images/omi-nfawa.jpg" alt="Omini Nfawa" fill sizes="(max-width: 700px) 90vw, 360px" style={{ objectFit: "cover" }} priority />
        </div>
        <div style={css("flex:2 1 380px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ABOUT</div>
          <h1 style={css("font-family:var(--font-heading);font-size:44px;margin:0 0 var(--space-2);")}>Omini Nfawa</h1>
          <div style={css("font-size:13px;letter-spacing:0.06em;opacity:0.6;margin-bottom:var(--space-4);text-transform:uppercase;")}>{TAGLINE}</div>
          <p style={css("font-size:17px;line-height:1.7;opacity:0.85;max-width:60ch;margin:0 0 var(--space-3);font-style:italic;")}>
            Creative troublemaker, occasionally.
          </p>
          {BIO.slice(0, 2).map((p, i) => (
            <p key={i} style={css("font-size:16px;line-height:1.7;opacity:0.8;max-width:60ch;margin:0 0 var(--space-3);")}>{p}</p>
          ))}
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);max-width:760px;")}>
        {BIO.slice(2).map((p, i) => (
          <p key={i} style={css("font-size:16px;line-height:1.75;opacity:0.8;margin:0 0 var(--space-4);")}>{p}</p>
        ))}
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
