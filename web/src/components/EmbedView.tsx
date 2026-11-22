import { toEmbed } from "@/lib/embed";
import { css } from "@/lib/css";

/** Renders one portfolio material safely: only allow-listed hosts are framed, everything else is a link. */
export default function EmbedView({ kind, url, title, caption }: { kind: string; url: string; title?: string | null; caption?: string | null }) {
  const e = toEmbed(kind, url);
  const label = title || (kind === "pdf" ? "Open the PDF" : "Open link");
  return (
    <figure style={css("margin:0 0 var(--space-6);")}>
      {e.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.src} alt={title || caption || ""} loading="lazy" style={css("width:100%;height:auto;border-radius:var(--radius-md);display:block;")} />
      )}
      {e.type === "iframe" && (
        <div style={css("position:relative;aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;background:#000;")}>
          <iframe src={e.src} title={title || e.title} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={css("position:absolute;inset:0;width:100%;height:100%;border:0;")} />
        </div>
      )}
      {e.type === "video" && <video src={e.src} controls preload="metadata" style={css("width:100%;border-radius:var(--radius-md);background:#000;")} />}
      {e.type === "link" && e.href !== "#" && (
        <a href={e.href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">{label}</a>
      )}
      {(title || caption) && e.type !== "link" && (
        <figcaption style={css("font-size:13px;opacity:0.7;margin-top:var(--space-2);")}>{title && <strong>{title}. </strong>}{caption}</figcaption>
      )}
      {caption && e.type === "link" && <p style={css("font-size:13px;opacity:0.7;margin:var(--space-2) 0 0;")}>{caption}</p>}
    </figure>
  );
}
