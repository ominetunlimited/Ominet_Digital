"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { fetchVideoThumbnail } from "@/lib/video";
import { uploadMedia } from "@/lib/admin/media-actions";
import { compressImage } from "@/lib/compressImage";

export default function VideoField({
  videoUrl,
  thumbnailUrl,
  onVideoUrlChange,
  onThumbnailUrlChange,
}: {
  videoUrl: string;
  thumbnailUrl: string;
  onVideoUrlChange: (url: string) => void;
  onThumbnailUrlChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function autoFetchThumbnail() {
    if (!videoUrl) return;
    setBusy(true);
    setMessage(null);
    const result = await fetchVideoThumbnail(videoUrl);
    setBusy(false);
    if (result.ok) {
      onThumbnailUrlChange(result.thumbnailUrl);
      setMessage(`Thumbnail found (${result.platform}).`);
    } else {
      setMessage(result.error);
    }
  }

  async function uploadThumbnail() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.set("file", compressed);
    const result = await uploadMedia(formData);
    setBusy(false);
    if (result.ok && result.url) onThumbnailUrlChange(result.url);
    else setMessage(result.ok ? null : result.error);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="field" style={css("margin-bottom:var(--space-4);")}>
      <label>Video link (optional — YouTube, TikTok, Vimeo, Facebook…)</label>
      <div style={css("display:flex;gap:var(--space-2);")}>
        <input
          className="input"
          placeholder="https://…"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          onBlur={autoFetchThumbnail}
          style={css("flex:1;")}
        />
        <button type="button" className="btn btn-secondary" onClick={autoFetchThumbnail} disabled={busy || !videoUrl}>
          Fetch thumbnail
        </button>
      </div>
      {message && <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-1);")}>{message}</p>}

      {videoUrl && (
        <div style={css("margin-top:var(--space-3);display:flex;gap:var(--space-3);align-items:center;")}>
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" style={css("width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:var(--radius-sm);")} />
          ) : (
            <div style={css("width:96px;aspect-ratio:16/9;border-radius:var(--radius-sm);background:var(--color-neutral-200);display:flex;align-items:center;justify-content:center;font-size:11px;opacity:0.5;")}>
              no thumbnail
            </div>
          )}
          <div style={css("flex:1;")}>
            <input ref={inputRef} type="file" accept="image/*" onChange={uploadThumbnail} disabled={busy} />
            <div style={css("font-size:11px;opacity:0.5;margin-top:var(--space-1);")}>Upload a thumbnail manually if auto-fetch didn&apos;t find one.</div>
          </div>
        </div>
      )}
    </div>
  );
}
