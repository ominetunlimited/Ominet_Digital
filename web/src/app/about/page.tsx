import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { ResearchProfileSection } from "@/components/ResearchProfileLinks";

export const metadata = pageMetadata(
  "About",
  "Omini Nfawa — writer, researcher and filmmaker working across essays, fiction and documentary. Founder of Ominet Digital and PROFILE.",
  "/about"
);

const work = [
  { label: "A Child's Cry in the Savannah, novel", year: "2026" },
  { label: "Founder, Ominet Digital", year: "2021–present" },
  { label: "Founder, PROFILE", year: "2024–present" },
];

export default function AboutPage() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="300" height="300" viewBox="0 0 300 300" style={css("position:absolute;right:-90px;top:20px;pointer-events:none;")} aria-hidden="true">
        <circle cx="150" cy="150" r="149" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.18" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:3/4;border-radius:var(--radius-md);overflow:hidden;flex:1 1 260px;max-width:360px;")}><PlaceholderImage label="Portrait" /></div>
        <div style={css("flex:2 1 380px;")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ABOUT</div>
          <h1 style={css("font-family:var(--font-heading);font-size:44px;margin:0 0 var(--space-4);")}>Omini Nfawa</h1>
          <p style={css("font-size:17px;line-height:1.7;opacity:0.8;max-width:56ch;margin:0;")}>Writer, researcher and filmmaker working across essays, fiction and documentary. Founder of Ominet Digital and PROFILE.</p>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>SELECTED WORK</div>
        <div style={css("display:grid;gap:var(--space-4);")}>
          {work.map((w, i) => (
            <div
              key={w.label}
              style={css(
                `display:flex;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap;${i < work.length - 1 ? "border-bottom:2px solid var(--color-divider);" : ""}padding-bottom:var(--space-3);`
              )}
            >
              <span>{w.label}</span><span style={css("opacity:0.55;")}>{w.year}</span>
            </div>
          ))}
        </div>
      </section>

      <ResearchProfileSection placement="profile" />

      <div className="hr" />
      <Footer />
    </div>
  );
}
