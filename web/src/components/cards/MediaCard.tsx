import Link from "next/link";
import Image from "next/image";
import PlaceholderImage from "@/components/PlaceholderImage";

/** Dark screening-room card for video and visual documentation. Always indigo, so footage reads the same in light and dark themes. */
export default function MediaCard({ href, title, caption, thumbUrl, label = "Video", meta, external }: {
  href: string; title: string; caption?: string; thumbUrl?: string | null; label?: string; meta?: string; external?: boolean;
}) {
  const isVideo = /video|film|watch/i.test(label);
  return (
    <article className="md-card">
      <div className="md-frame">
        {thumbUrl ? (
          // Remote video thumbnails come from arbitrary hosts, so a plain img avoids needing each host allow-listed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" loading="lazy" className="md-img" />
        ) : <PlaceholderImage kind="media" title={title} />}
        <span className="md-scrim" aria-hidden="true" />
        {isVideo && (
          <span className="md-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z" /></svg></span>
        )}
        <span className="md-badge">{label}</span>
      </div>
      <div className="md-body">
        <h3 className="md-title">{title}</h3>
        {caption && <p className="md-caption">{caption}</p>}
        {meta && <div className="md-meta">{meta}</div>}
      </div>
      <Link href={href} className="md-link" aria-label={`${title}: ${isVideo ? "watch" : "view"}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} />
    </article>
  );
}
