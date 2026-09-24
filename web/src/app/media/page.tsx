import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Media",
  "Video, photography and documentary work from Omini Nfawa and the Ominet Digital ecosystem.",
  "/media"
);

const videos = [
  { title: "The Long Return — Trailer", meta: "Short Film · 6 min" },
  { title: "Delta Towns: A Documentary", meta: "Documentary · 24 min" },
  { title: "On Independent Publishing", meta: "Interview · 32 min" },
];

export default function MediaPage() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="220" height="220" viewBox="0 0 220 220" style={css("position:absolute;right:-40px;top:20px;pointer-events:none;")} aria-hidden="true">
        <rect x="1" y="1" width="218" height="218" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.18" />
        <rect x="35" y="35" width="150" height="150" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.13" />
        <circle cx="110" cy="110" r="40" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.12" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>MEDIA</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Video &amp; Photography</h1>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-4) var(--space-6);display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <span className="tag tag-accent">All</span>
        <span className="tag tag-outline">Videos</span>
        <span className="tag tag-outline">Photography</span>
        <span className="tag tag-outline">Documentaries</span>
        <span className="tag tag-outline">Interviews</span>
        <span className="tag tag-outline">Short Films</span>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>VIDEOS</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
          {videos.map((v) => (
            <a href="#" key={v.title}>
              <div style={css("aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);")}><PlaceholderImage label="Thumbnail" /></div>
              <div style={css("font-family:var(--font-heading);font-size:18px;margin-bottom:var(--space-1);")}>{v.title}</div>
              <div style={css("font-size:12px;opacity:0.55;")}>{v.meta}</div>
            </a>
          ))}
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>PHOTOGRAPHY</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-3);")}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={css("aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;")}><PlaceholderImage label="Photo" /></div>
          ))}
        </div>
        <p style={css("font-size:13px;opacity:0.55;margin-top:var(--space-3);")}>Coastline Series &middot; Niger Delta, 2026</p>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
