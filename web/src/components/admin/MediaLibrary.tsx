"use client";

import { useMemo, useRef, useState } from "react";
import { css } from "@/lib/css";
import { uploadMedia, deleteMedia, updateMediaAsset } from "@/lib/admin/media-actions";
import { compressImage } from "@/lib/compressImage";
import { useAdminAction } from "@/lib/admin/useAdminAction";

export type Asset = {
  id: string;
  url: string;
  title: string | null;
  kind: string;
  storage_path: string;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

const KIND_FILTERS = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
  { key: "document", label: "Documents" },
] as const;

function Thumb({ a, size = 160 }: { a: Asset; size?: number }) {
  if (a.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.url} alt={a.alt_text ?? a.title ?? ""} style={css(`width:100%;height:${size}px;object-fit:cover;border-radius:var(--radius-sm);display:block;`)} />;
  }
  return (
    <div style={css(`width:100%;height:${size}px;display:flex;align-items:center;justify-content:center;background:var(--color-neutral-200);border-radius:var(--radius-sm);font-size:11px;text-transform:uppercase;opacity:0.6;`)}>
      {a.kind}
    </div>
  );
}

function EditPanel({ asset, onClose, onSaved, onDeleted }: { asset: Asset; onClose: () => void; onSaved: (a: Asset) => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(asset.title ?? "");
  const [alt, setAlt] = useState(asset.alt_text ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const { busy, saved, error, run } = useAdminAction();
  const del = useAdminAction();

  async function save() {
    const result = await run(() => updateMediaAsset(asset.id, { title, alt_text: alt, caption }));
    if (result?.ok) onSaved({ ...asset, title: title || null, alt_text: alt || null, caption: caption || null });
  }
  async function remove() {
    if (!confirm(`Delete "${asset.title ?? "this file"}"? This can't be undone.`)) return;
    const result = await del.run(() => deleteMedia(asset.id, asset.storage_path));
    if (result?.ok) onDeleted();
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" style={css("width:min(560px,100%);")} onClick={(e) => e.stopPropagation()}>
        <div style={css("display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);")}>
          <div className="dialog-title" style={css("font-size:17px;overflow-wrap:anywhere;")}>{asset.title || "Untitled"}</div>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={css("border-radius:var(--radius-md);overflow:hidden;background:var(--color-neutral-100);")}>
          {asset.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt={asset.alt_text ?? ""} style={css("width:100%;max-height:320px;object-fit:contain;display:block;")} />
          ) : asset.kind === "video" ? (
            <video src={asset.url} controls style={css("width:100%;max-height:320px;display:block;")} />
          ) : asset.kind === "audio" ? (
            <audio src={asset.url} controls style={css("width:100%;display:block;padding:var(--space-4);")} />
          ) : (
            <div style={css("padding:var(--space-6);text-align:center;font-size:13px;opacity:0.6;")}>No preview for this file type.</div>
          )}
        </div>

        <div style={css("font-size:12px;opacity:0.6;display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <span>{asset.kind}</span>
          {asset.width && asset.height && <span>{asset.width} × {asset.height}</span>}
          <span>Added {new Date(asset.created_at).toLocaleDateString()}</span>
        </div>

        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Alt text (for screen readers &amp; SEO)</label>
          <input className="input" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <div className="field">
          <label>Caption</label>
          <textarea className="input" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>

        {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
        {del.error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{del.error}</p>}

        <div className="dialog-actions" style={css("justify-content:space-between;")}>
          <div style={css("display:flex;gap:var(--space-2);")}>
            <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(asset.url)}>Copy URL</button>
            <button type="button" className="btn btn-secondary" style={css("color:var(--om-coral);border-color:var(--om-coral);")} disabled={del.busy} onClick={remove}>
              {del.busy ? "Deleting…" : "Delete"}
            </button>
          </div>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]["key"]>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Asset | null>(null);
  const { busy, error, run } = useAdminAction();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (!term) return true;
      return [a.title, a.alt_text, a.caption].some((v) => v?.toLowerCase().includes(term));
    });
  }, [assets, q, kind]);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const result = await run(async () => {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
      const formData = new FormData();
      formData.set("file", compressed);
      return uploadMedia(formData);
    });
    if (!result?.ok) return;
    if (inputRef.current) inputRef.current.value = "";
    window.location.reload();
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete "${asset.title ?? "this file"}"? This can't be undone.`)) return;
    const result = await run(() => deleteMedia(asset.id, asset.storage_path));
    if (result?.ok) setAssets((a) => a.filter((x) => x.id !== asset.id));
  }

  return (
    <div>
      <div style={css("display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <input ref={inputRef} type="file" accept="image/*,video/*,audio/*,application/pdf" style={css("max-width:100%;")} />
        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-4);")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap;margin-bottom:var(--space-4);")}>
        <input className="input" placeholder="Search title, alt text or caption…" value={q} onChange={(e) => setQ(e.target.value)} style={css("max-width:280px;flex:1;min-width:180px;")} />
        <div style={css("display:flex;gap:6px;flex-wrap:wrap;")}>
          {KIND_FILTERS.map((f) => (
            <button key={f.key} type="button" className={f.key === kind ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:12px;padding:6px 10px;")} onClick={() => setKind(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={css("display:flex;gap:2px;margin-left:auto;")}>
          <button type="button" className={view === "grid" ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:12px;padding:6px 10px;")} onClick={() => setView("grid")}>Grid</button>
          <button type="button" className={view === "list" ? "btn btn-primary" : "btn btn-secondary"} style={css("font-size:12px;padding:6px 10px;")} onClick={() => setView("list")}>List</button>
        </div>
      </div>

      <p style={css("font-size:12px;opacity:0.55;margin:0 0 var(--space-4);")}>{filtered.length} of {assets.length} file{assets.length === 1 ? "" : "s"}</p>

      {filtered.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>{assets.length === 0 ? "No media uploaded yet." : "Nothing matches this search/filter."}</p>
      ) : view === "grid" ? (
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--space-4);")}>
          {filtered.map((a) => (
            <div key={a.id} className="card" style={css("padding:var(--space-2);gap:var(--space-2);")}>
              <button type="button" onClick={() => setEditing(a)} style={css("display:block;width:100%;padding:0;border:0;background:none;cursor:pointer;text-align:left;")} aria-label={`Preview ${a.title ?? "file"}`}>
                <Thumb a={a} />
              </button>
              <div style={css("font-size:11px;opacity:0.7;word-break:break-word;")}>{a.title || <span style={css("opacity:0.5;")}>Untitled</span>}</div>
              <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
                <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:2px 6px;")} onClick={() => setEditing(a)}>Edit</button>
                <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:2px 6px;")} onClick={() => navigator.clipboard.writeText(a.url)}>Copy URL</button>
                <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:2px 6px;color:var(--om-coral);")} onClick={() => handleDelete(a)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="table table-responsive" style={css("width:100%;")}>
          <thead><tr><th></th><th>Title</th><th>Kind</th><th>Added</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td data-label="">
                  <button type="button" onClick={() => setEditing(a)} style={css("display:block;width:56px;padding:0;border:0;background:none;cursor:pointer;")} aria-label={`Preview ${a.title ?? "file"}`}>
                    <Thumb a={a} size={44} />
                  </button>
                </td>
                <td data-label="Title">{a.title || <span style={css("opacity:0.5;")}>Untitled</span>}</td>
                <td data-label="Kind">{a.kind}</td>
                <td data-label="Added">{new Date(a.created_at).toLocaleDateString()}</td>
                <td data-label="Actions">
                  <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;justify-content:flex-end;")}>
                    <button type="button" className="btn btn-ghost" style={css("font-size:12px;")} onClick={() => setEditing(a)}>Edit</button>
                    <button type="button" className="btn btn-ghost" style={css("font-size:12px;")} onClick={() => navigator.clipboard.writeText(a.url)}>Copy URL</button>
                    <button type="button" className="btn btn-ghost" style={css("font-size:12px;color:var(--om-coral);")} onClick={() => handleDelete(a)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <EditPanel
          asset={editing}
          onClose={() => setEditing(null)}
          onSaved={(a) => { setAssets((list) => list.map((x) => (x.id === a.id ? a : x))); setEditing(null); }}
          onDeleted={() => { setAssets((list) => list.filter((x) => x.id !== editing.id)); setEditing(null); }}
        />
      )}
    </div>
  );
}
