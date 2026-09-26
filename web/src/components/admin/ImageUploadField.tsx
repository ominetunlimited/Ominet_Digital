"use client";

import { useRef } from "react";
import { css } from "@/lib/css";
import { uploadMedia } from "@/lib/admin/media-actions";
import { compressImage } from "@/lib/compressImage";
import { useAdminAction } from "@/lib/admin/useAdminAction";

/**
 * Optional cover-image field for admin forms (content, books). Upload a
 * file or paste a URL directly — either way it's optional: leave it empty
 * and the public page falls back to the design's placeholder, no error.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { busy, error, run } = useAdminAction();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const result = await run(async () => {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.set("file", compressed);
      return uploadMedia(formData);
    });
    if (result?.ok && result.url) onChange(result.url);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="field" style={css("margin-bottom:var(--space-4);")}>
      <label>{label} (optional)</label>
      {value && (
        <div style={css("display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-2);")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={css("width:64px;height:64px;object-fit:cover;border-radius:var(--radius-sm);")} />
          <button type="button" className="btn btn-ghost" style={css("font-size:12px;color:var(--om-coral);")} onClick={() => onChange("")}>
            Remove
          </button>
        </div>
      )}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} disabled={busy} style={css("flex:1;min-width:180px;")} />
        <span style={css("font-size:12px;opacity:0.5;")}>or</span>
        <input
          className="input"
          placeholder="paste an image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={css("flex:1;min-width:180px;")}
        />
      </div>
      {busy && <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-1);")}>Compressing &amp; uploading…</p>}
      {error && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-1);")}>{error}</p>}
    </div>
  );
}
