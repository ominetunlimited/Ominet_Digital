import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import AdSlot from "@/components/AdSlot";
import MediaCard from "@/components/cards/MediaCard";
import PortfolioCard from "@/components/cards/PortfolioCard";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getMediaPhotos, getVideoPosts } from "@/lib/data";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Media",
  "Video, photography and documentary work from Omini Nfawa and the Ominet Digital ecosystem.",
  "/media"
);

export default async function MediaPage() {
  const [videos, photos] = await Promise.all([getVideoPosts(), getMediaPhotos()]);

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

      <AdSlot slotKey="media_page" />

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>VIDEOS</div>
        {videos.length === 0 ? (
          <EmptyState title="No videos yet." body="Nothing here yet. Please check back soon." />
        ) : (
          <div className="md-grid">
            {videos.map((v) => (
              <MediaCard key={v.slug} href={`/articles/${v.slug}`} title={v.title} thumbUrl={v.videoThumbnailUrl} label="Video" meta={v.readMinutes ? `${v.readMinutes} min` : undefined} />
            ))}
          </div>
        )}
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>PHOTOGRAPHY</div>
        {photos.length === 0 ? (
          <EmptyState title="No photographs yet." body="Nothing here yet. Please check back soon." />
        ) : (
          <div className="pf-grid">
            {photos.map((p, i) => (
              <PortfolioCard key={p.id} index={i} imageUrl={p.url} alt={p.altText ?? ""} title={p.title ?? undefined} caption={p.caption} category="Photography" />
            ))}
          </div>
        )}
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
