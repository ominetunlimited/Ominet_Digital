import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EmptyState from "@/components/EmptyState";
import AdSlot from "@/components/AdSlot";
import VideoThumbnail from "@/components/VideoThumbnail";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getMediaPhotos, getVideoPosts } from "@/lib/data";

export const revalidate = 60;

export const metadata = pageMetadata(
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
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-6);")}>
            {videos.map((v) => (
              <div key={v.slug}>
                <VideoThumbnail url={v.videoUrl} thumbnailUrl={v.videoThumbnailUrl} />
                <Link href={`/writing/${v.slug}`}>
                  <div style={css("font-family:var(--font-heading);font-size:18px;margin:var(--space-2) 0 var(--space-1);")}>{v.title}</div>
                </Link>
                {v.readMinutes && <div style={css("font-size:12px;opacity:0.55;")}>{v.readMinutes} min read</div>}
              </div>
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
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-3);")}>
            {photos.map((p) => (
              <div key={p.id} style={css("aspect-ratio:1;position:relative;border-radius:var(--radius-md);overflow:hidden;")}>
                {p.url ? (
                  <Image src={p.url} alt={p.altText ?? ""} fill sizes="220px" style={{ objectFit: "cover" }} />
                ) : (
                  <PlaceholderImage label="Photo" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
