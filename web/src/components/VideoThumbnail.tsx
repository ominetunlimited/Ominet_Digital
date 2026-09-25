import { css } from "@/lib/css";

/** A clickable video thumbnail (or a labelled placeholder if none was set) that opens the source video in a new tab. */
export default function VideoThumbnail({ url, thumbnailUrl }: { url: string; thumbnailUrl?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={css(
        "position:relative;display:block;aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;background:var(--color-neutral-200);"
      )}
    >
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
      )}
      <span
        style={css(
          "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,51,55,0.25);"
        )}
      >
        <span style={css("width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--om-navy)"><path d="M8 5v14l11-7Z" /></svg>
        </span>
      </span>
    </a>
  );
}
