"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveContent, deleteContent, type ContentInput } from "@/lib/admin/content-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import VideoField from "@/components/admin/VideoField";
import { slugify } from "@/lib/slug";
import { useAdminAction } from "@/lib/admin/useAdminAction";

const TYPES = ["article", "essay", "research", "poem", "fiction", "review", "interview", "note"];
const ACCESS = ["free", "paid", "members", "preview"];
const STATUSES = ["draft", "scheduled", "published", "archived"];

export default function ContentForm({ initial }: { initial?: Partial<ContentInput> & { id?: string } }) {
  const [values, setValues] = useState<ContentInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    type: initial?.type ?? "article",
    dek: initial?.dek ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    access: initial?.access ?? "free",
    price_cents: initial?.price_cents ?? null,
    currency: initial?.currency ?? "NGN",
    status: initial?.status ?? "draft",
    published_at: initial?.published_at ?? null,
    read_minutes: initial?.read_minutes ?? null,
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
    og_image_url: initial?.og_image_url ?? "",
    featured_image_url: initial?.featured_image_url ?? "",
    video_url: initial?.video_url ?? "",
    video_thumbnail_url: initial?.video_thumbnail_url ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const { busy, error, run } = useAdminAction();

  function set<K extends keyof ContentInput>(key: K, value: ContentInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit() {
    await run(() => saveContent(values));
  }

  async function remove() {
    if (!values.id || !confirm(`Delete "${values.title}"? This can't be undone.`)) return;
    await run(() => deleteContent(values.id!));
  }

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Title</label>
        <input
          className="input"
          value={values.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Slug (this is the URL — /writing/your-slug)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
      </div>
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Type</label>
          <select className="input" value={values.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Status</label>
          <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <ImageUploadField label="Cover image" value={values.featured_image_url} onChange={(url) => set("featured_image_url", url)} />

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Dek (subtitle)</label>
        <input className="input" value={values.dek} onChange={(e) => set("dek", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Excerpt</label>
        <textarea className="input" rows={2} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Body</label>
        <textarea className="input" rows={10} value={values.body} onChange={(e) => set("body", e.target.value)} placeholder="Paragraphs separated by a blank line." />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Read time (minutes)</label>
        <input className="input" type="number" value={values.read_minutes ?? ""} onChange={(e) => set("read_minutes", e.target.value ? Number(e.target.value) : null)} />
      </div>

      <VideoField
        videoUrl={values.video_url}
        thumbnailUrl={values.video_thumbnail_url}
        onVideoUrlChange={(url) => set("video_url", url)}
        onThumbnailUrlChange={(url) => set("video_thumbnail_url", url)}
      />

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Access</label>
          <select className="input" value={values.access} onChange={(e) => set("access", e.target.value)}>
            {ACCESS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {values.access === "paid" && (
          <>
            <div className="field" style={css("flex:1;")}>
              <label>Price (cents)</label>
              <input className="input" type="number" value={values.price_cents ?? ""} onChange={(e) => set("price_cents", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="field" style={css("flex:1;")}>
              <label>Currency</label>
              <select className="input" value={values.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin:var(--space-6) 0 var(--space-3);")}>SEO</div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO title (optional — falls back to Title)</label>
        <input className="input" value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO description (optional — falls back to Excerpt)</label>
        <textarea className="input" rows={2} value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
      </div>
      <ImageUploadField label="Social share image" value={values.og_image_url} onChange={(url) => set("og_image_url", url)} />

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
