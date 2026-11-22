"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploadField from "@/components/admin/ImageUploadField";
import FormActions from "@/components/admin/FormActions";
import { css } from "@/lib/css";
import { slugify } from "@/lib/slug";
import { MEDIA_KINDS } from "@/lib/embed";
import { LABELS } from "@/lib/portfolio-labels";
import { compressImage } from "@/lib/compressImage";
import { uploadMedia } from "@/lib/admin/media-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { savePortfolioItem, deletePortfolioItem, type PortfolioInput } from "@/lib/admin/portfolio-actions";

const field = "margin-bottom:var(--space-4);";

function MediaRow({ m, i, last, onChange, onMove, onRemove }: {
  m: PortfolioInput["media"][number]; i: number; last: boolean;
  onChange: (patch: Partial<PortfolioInput["media"][number]>) => void; onMove: (d: -1 | 1) => void; onRemove: () => void;
}) {
  const { busy, error, run } = useAdminAction();
  const ref = useRef<HTMLInputElement>(null);
  async function upload() {
    const file = ref.current?.files?.[0];
    if (!file) return;
    const res = await run(async () => {
      const f = m.kind === "image" ? await compressImage(file) : file;
      const fd = new FormData();
      fd.set("file", f);
      return uploadMedia(fd);
    });
    if (res?.ok && res.url) onChange({ url: res.url });
    if (ref.current) ref.current.value = "";
  }
  const hint = m.kind === "video" ? "Paste a YouTube or Vimeo link, or upload a short video file" : m.kind === "slides" ? "Paste a Google Slides (published or shared) or Canva link" : m.kind === "image" ? "Upload a photo or paste its link" : "Paste the link";
  return (
    <div className="card" style={css("gap:var(--space-2);")}>
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <select className="input" style={css("flex:1;min-width:180px;")} value={m.kind} onChange={(e) => onChange({ kind: e.target.value })} aria-label={`Item ${i + 1} type`}>
          {MEDIA_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => onMove(-1)} aria-label="Move up">Up</button>
        <button type="button" className="btn btn-ghost" disabled={last} onClick={() => onMove(1)} aria-label="Move down">Down</button>
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} onClick={onRemove}>Remove</button>
      </div>
      <input className="input" placeholder={hint} value={m.url} onChange={(e) => onChange({ url: e.target.value })} />
      {(m.kind === "image" || m.kind === "video" || m.kind === "pdf" || m.kind === "slides") && (
        <div>
          <input ref={ref} type="file" accept={m.kind === "image" ? "image/*" : m.kind === "video" ? "video/mp4,video/webm" : "application/pdf"} onChange={() => void upload()} disabled={busy} style={css("font-size:12px;")} />
          <span style={css("font-size:11px;opacity:0.55;margin-left:8px;")}>{busy ? "Uploading…" : "Uploads are limited to 10 MB. For longer videos, use YouTube or Vimeo."}</span>
        </div>
      )}
      {error && <p style={css("font-size:12px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <input className="input" placeholder="Title (optional)" value={m.title} onChange={(e) => onChange({ title: e.target.value })} />
      <input className="input" placeholder="Caption (optional)" value={m.caption} onChange={(e) => onChange({ caption: e.target.value })} />
    </div>
  );
}

export default function PortfolioForm({ initial }: { initial?: Partial<PortfolioInput> }) {
  const [v, setV] = useState<PortfolioInput>({
    id: initial?.id, title: initial?.title ?? "", slug: initial?.slug ?? "", summary: initial?.summary ?? "", label: initial?.label ?? "personal",
    client_name: initial?.client_name ?? "", role: initial?.role ?? "", year_label: initial?.year_label ?? "", services: initial?.services ?? "",
    body_html: initial?.body_html ?? "", cover_image_url: initial?.cover_image_url ?? "", status: initial?.status ?? "draft", featured: initial?.featured ?? false,
    display_order: initial?.display_order ?? 0, permission_confirmed: initial?.permission_confirmed ?? false, seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "", media: initial?.media ?? [],
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const { busy, saved, error, run } = useAdminAction();
  const router = useRouter();
  const set = <K extends keyof PortfolioInput>(k: K, val: PortfolioInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const needsPermission = v.label === "volunteer" || v.label === "paid";

  async function persist(status?: string, navigate = true): Promise<string | null> {
    const payload = status ? { ...v, status } : v;
    const res = await run(() => savePortfolioItem(payload));
    if (!res?.ok) return null;
    setSavedSlug(slugify(v.slug || v.title));
    if (status) set("status", status);
    if (res.id && !v.id) {
      set("id", res.id);
      if (navigate) setTimeout(() => router.push(`/admin/portfolio/${res.id}`), 900);
    } else router.refresh();
    return res.id ?? v.id ?? null;
  }
  async function remove() {
    if (!v.id || !confirm(`Delete "${v.title}"? This can't be undone.`)) return;
    const r = await run(() => deletePortfolioItem(v.id!));
    if (r?.ok) router.push("/admin/portfolio");
  }
  const updateMedia = (i: number, patch: Partial<PortfolioInput["media"][number]>) => set("media", v.media.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const moveMedia = (i: number, d: -1 | 1) => {
    const next = [...v.media]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("media", next);
  };

  return (
    <div style={css("max-width:680px;")}>
      <div className="field" style={css(field)}>
        <label>Project title</label>
        <input className="input" value={v.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched || v.slug === slugify(v.title)) set("slug", slugify(e.target.value)); }} />
      </div>
      <div className="field" style={css(field)}>
        <label>Slug (the web address: /work/your-slug)</label>
        <input className="input" value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} onBlur={(e) => set("slug", slugify(e.target.value))} />
      </div>
      <div className="field" style={css(field)}>
        <label>What kind of project is this?</label>
        <select className="input" value={v.label} onChange={(e) => set("label", e.target.value)}>
          {Object.entries(LABELS).map(([k, l]) => <option key={k} value={k}>{l.name}</option>)}
        </select>
        <p style={css("font-size:12px;opacity:0.6;margin:6px 0 0;")}>{LABELS[v.label]?.note} This label is shown publicly so visitors are never misled about where the work came from.</p>
      </div>
      {needsPermission && (
        <label className="radio" style={css("display:block;margin-bottom:var(--space-4);")}>
          <input type="checkbox" checked={v.permission_confirmed} onChange={(e) => set("permission_confirmed", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
          I have the client&apos;s permission to show this work publicly (required to publish)
        </label>
      )}
      <ImageUploadField label="Cover image" value={v.cover_image_url} onChange={(u) => set("cover_image_url", u)} />
      <div className="field" style={css(field)}>
        <label>Short summary (shown on the Work page)</label>
        <textarea className="input" rows={2} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:160px;")}><label>Client or organisation (optional)</label><input className="input" value={v.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
        <div className="field" style={css("flex:1;min-width:160px;")}><label>Your role</label><input className="input" value={v.role} onChange={(e) => set("role", e.target.value)} placeholder="Editor, designer, filmmaker…" /></div>
        <div className="field" style={css("flex:1;min-width:120px;")}><label>Year</label><input className="input" value={v.year_label} onChange={(e) => set("year_label", e.target.value)} placeholder="2026" /></div>
      </div>
      <div className="field" style={css(field)}>
        <label>Services involved (comma separated)</label>
        <input className="input" value={v.services} onChange={(e) => set("services", e.target.value)} placeholder="Video editing, Presentation design" />
      </div>
      <div className="field" style={css(field)}>
        <label>The story (brief, what you did, the result)</label>
        <RichTextEditor value={v.body_html} onChange={(h) => set("body_html", h)} placeholder="Describe the brief, your process and what came out of it. Do not claim results you cannot show." minHeight={260} />
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin:var(--space-6) 0 var(--space-3);")}>MATERIALS: SLIDES, VIDEOS, PHOTOS, PDFS</div>
      <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-3);")}>
        {v.media.map((m, i) => (
          <MediaRow key={i} m={m} i={i} last={i === v.media.length - 1} onChange={(p) => updateMedia(i, p)} onMove={(d) => moveMedia(i, d)} onRemove={() => set("media", v.media.filter((_, x) => x !== i))} />
        ))}
      </div>
      <button type="button" className="btn btn-secondary" style={css("margin-bottom:var(--space-6);")} onClick={() => set("media", [...v.media, { kind: "image", url: "", title: "", caption: "" }])}>Add material</button>

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <label className="radio"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} /> Feature at the top</label>
        <div className="field" style={css("width:120px;")}><label>Order</label><input className="input" type="number" value={v.display_order} onChange={(e) => set("display_order", Number(e.target.value))} /></div>
      </div>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SEO</div>
      <div className="field" style={css(field)}><label>SEO title (optional)</label><input className="input" value={v.seo_title} onChange={(e) => set("seo_title", e.target.value)} /></div>
      <div className="field" style={css(field)}><label>SEO description (optional)</label><textarea className="input" rows={2} value={v.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></div>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}
      <FormActions isNew={!v.id} busy={busy} saved={saved} disabled={!v.title || !v.slug} onSave={() => void persist()} onPublish={() => void persist("published")} onDraft={() => void persist("draft")}
        previewHref={savedSlug ? `/work/${savedSlug}` : null} onPreviewNew={async () => ((await persist("draft", false)) ? `/work/${slugify(v.slug || v.title)}` : null)} onDelete={remove} />
    </div>
  );
}
