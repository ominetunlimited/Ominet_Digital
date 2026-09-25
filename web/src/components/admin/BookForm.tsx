"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveBook, deleteBook, type BookInput } from "@/lib/admin/book-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/slug";

const STATUSES = ["draft", "scheduled", "published", "archived"];

export default function BookForm({ initial }: { initial?: Partial<BookInput> & { id?: string } }) {
  const [values, setValues] = useState<BookInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    kind: initial?.kind ?? "Novel",
    year: initial?.year ?? "",
    pages: initial?.pages ?? "",
    excerpt: initial?.excerpt ?? "",
    description: initial?.description ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    formats: initial?.formats ?? [],
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    purchaseLinks: initial?.purchaseLinks ?? [],
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof BookInput>(key: K, value: BookInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateLink(i: number, patch: Partial<BookInput["purchaseLinks"][number]>) {
    set("purchaseLinks", values.purchaseLinks.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await saveBook(values);
    setBusy(false);
    if (result && !result.ok) setError(result.error);
  }

  async function remove() {
    if (!values.id || !confirm(`Delete "${values.title}"? This can't be undone.`)) return;
    setBusy(true);
    const result = await deleteBook(values.id);
    setBusy(false);
    if (result && !result.ok) setError(result.error);
  }

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Title</label>
        <input className="input" value={values.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Slug (this is the URL — /books/your-slug)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
      </div>
      <ImageUploadField label="Cover image" value={values.cover_image_url} onChange={(url) => set("cover_image_url", url)} />
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Kind</label>
          <input className="input" value={values.kind} onChange={(e) => set("kind", e.target.value)} placeholder="Novel, Essays, Poetry…" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Year</label>
          <input className="input" value={values.year} onChange={(e) => set("year", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Status</label>
          <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Excerpt</label>
        <textarea className="input" rows={3} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Formats (comma-separated)</label>
        <input
          className="input"
          value={values.formats.join(", ")}
          onChange={(e) => set("formats", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Ebook, Paperback, Audio"
        />
      </div>
      <label className="radio" style={css("margin-bottom:var(--space-6);")}>
        <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        Featured on Home / Books
      </label>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>WHERE TO BUY</div>
      <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-3);")}>
        {values.purchaseLinks.map((link, i) => (
          <div key={i} className="card" style={css("gap:var(--space-2);")}>
            <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
              <input className="input" style={css("flex:1;min-width:100px;")} placeholder="Platform (selar, amazon…)" value={link.platform} onChange={(e) => updateLink(i, { platform: e.target.value })} />
              <input className="input" style={css("flex:1;min-width:100px;")} placeholder="Button label" value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
            </div>
            <input className="input" placeholder="https://…" value={link.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
            <button
              type="button"
              className="btn btn-ghost"
              style={css("align-self:flex-start;color:var(--om-coral);")}
              onClick={() => set("purchaseLinks", values.purchaseLinks.filter((_, idx) => idx !== i))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        style={css("margin-bottom:var(--space-6);")}
        onClick={() => set("purchaseLinks", [...values.purchaseLinks, { label: "", platform: "", url: "" }])}
      >
        Add purchase link
      </button>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-3);")}>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !values.title || !values.slug}>
          {busy ? "Saving…" : values.id ? "Save changes" : "Create"}
        </button>
        {values.id && (
          <button type="button" className="btn btn-secondary" onClick={remove} disabled={busy} style={css("color:var(--om-coral);border-color:var(--om-coral);")}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
