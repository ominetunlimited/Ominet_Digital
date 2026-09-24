"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { uploadMedia, deleteMedia } from "@/lib/admin/media-actions";

type Asset = { id: string; url: string; title: string | null; kind: string; storage_path: string };

export default function MediaLibrary({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    window.location.reload();
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete "${asset.title}"?`)) return;
    await deleteMedia(asset.id, asset.storage_path);
    setAssets((a) => a.filter((x) => x.id !== asset.id));
  }

  return (
    <div>
      <div style={css("display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;")}>
        <input ref={inputRef} type="file" accept="image/*,video/*,audio/*,application/pdf" />
        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-4);")}>{error}</p>}

      {assets.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No media uploaded yet.</p>
      ) : (
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--space-4);")}>
          {assets.map((a) => (
            <div key={a.id} className="card" style={css("padding:var(--space-2);gap:var(--space-2);")}>
              {a.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.title ?? ""} style={css("width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-sm);")} />
              ) : (
                <div style={css("width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--color-neutral-200);border-radius:var(--radius-sm);font-size:11px;text-transform:uppercase;opacity:0.6;")}>
                  {a.kind}
                </div>
              )}
              <div style={css("font-size:11px;opacity:0.7;word-break:break-word;")}>{a.title}</div>
              <div style={css("display:flex;gap:var(--space-2);")}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={css("font-size:11px;padding:2px 6px;")}
                  onClick={() => navigator.clipboard.writeText(a.url)}
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={css("font-size:11px;padding:2px 6px;color:var(--om-coral);")}
                  onClick={() => handleDelete(a)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
