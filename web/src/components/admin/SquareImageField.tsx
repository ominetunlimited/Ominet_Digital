"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import ImageUploadField from "@/components/admin/ImageUploadField";

/** Upload for the dedicated 1:1 social share image (1080 x 1080), with a live square preview and a clear fallback. */
export default function SquareImageField({ value, fallback, onChange }: { value: string; fallback: string; onChange: (url: string) => void }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const shown = value || fallback;
  const ratio = dims ? dims.w / dims.h : 1;
  const notSquare = Boolean(value) && dims !== null && Math.abs(ratio - 1) > 0.02;
  const small = Boolean(value) && dims !== null && Math.min(dims.w, dims.h) < 600;
  return (
    <div>
      <ImageUploadField label="Square social image (1:1, 1080 × 1080 recommended)" value={value} onChange={(u) => { setDims(null); onChange(u); }} />
      <div style={css("display:flex;gap:var(--space-3);align-items:flex-start;flex-wrap:wrap;")}>
        <div style={css("width:160px;aspect-ratio:1/1;border:1px solid var(--color-divider);border-radius:var(--radius-md);overflow:hidden;background:var(--color-surface);display:grid;place-items:center;font-size:11px;opacity:0.9;")} aria-label="Square preview">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Square social preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onLoad={(e) => value && setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          ) : <span>No image yet</span>}
        </div>
        <div style={css("flex:1;min-width:200px;font-size:12px;line-height:1.6;")}>
          <p style={css("margin:0 0 6px;opacity:0.75;")}>{value ? "This image is used for link previews on Facebook, WhatsApp, LinkedIn and similar." : fallback ? "No square image set. The cover image is used instead, centre-cropped to a square." : "Upload a square image, or the cover image will be used."}</p>
          {notSquare && <p role="status" style={css("margin:0 0 6px;color:var(--om-coral);")}>This image is {dims!.w} × {dims!.h}, not square. Shares will centre-crop it to 1080 × 1080.</p>}
          {small && <p role="status" style={css("margin:0 0 6px;color:var(--om-coral);")}>This image is quite small. 1080 × 1080 gives the sharpest previews.</p>}
          {value && <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:2px 8px;")} onClick={() => { setDims(null); onChange(""); }}>Remove (use cover image)</button>}
        </div>
      </div>
    </div>
  );
}
