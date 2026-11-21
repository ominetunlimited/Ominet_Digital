"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveContent, deleteContent, type ContentInput } from "@/lib/admin/content-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import VideoField from "@/components/admin/VideoField";
import MoneyInput from "@/components/admin/MoneyInput";
import FormActions from "@/components/admin/FormActions";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import ContentFilePanel, { type ContentAttachment } from "@/components/admin/ContentFilePanel";
import RelatedItemsPanel from "@/components/admin/RelatedItemsPanel";
import RichTextEditor from "@/components/admin/RichTextEditor";
import SquareImageField from "@/components/admin/SquareImageField";
import CategoryPicker, { type CatOption } from "@/components/admin/CategoryPicker";

const TYPES = ["article", "essay", "research", "poem", "fiction", "review", "interview", "note"];
const ACCESS = ["free", "paid", "members", "preview"];
const STATUSES = ["draft", "scheduled", "published", "archived"];

// What each Type can be narrowed down to. Not every type has one (a plain
// "note" doesn't need it) — those get no second dropdown at all.
const SUBCATEGORIES: Record<string, string[]> = {
  article: ["Opinion", "News", "Feature", "Commentary", "Analysis"],
  essay: ["Personal essay", "Critical essay", "Literary essay", "Social commentary", "Memoir"],
  research: ["Journal article", "Thesis / Dissertation", "Conference paper", "Book chapter", "Festschrift contribution", "Literature review"],
  fiction: ["Novel", "Novella", "Short story", "Play / Drama", "Flash fiction", "Script / Screenplay"],
  poem: ["Sonnet", "Free verse", "Spoken word", "Narrative poem", "Poetry collection"],
  review: ["Book review", "Film review", "Media review", "Performance review"],
  interview: ["Q&A", "Profile interview", "Panel / Roundtable"],
};

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function ContentForm({
  initial,
  attachment = null,
  categories = [],
}: {
  initial?: Partial<ContentInput> & { id?: string };
  attachment?: ContentAttachment | null;
  categories?: CatOption[];
}) {
  const [values, setValues] = useState<ContentInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    type: initial?.type ?? "article",
    subcategory: initial?.subcategory ?? "",
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
    featured: initial?.featured ?? false,
    external_url: initial?.external_url ?? "",
    external_label: initial?.external_label ?? "",
    in_blog: initial?.in_blog ?? false,
    blog_featured: initial?.blog_featured ?? false,
    category_id: initial?.category_id ?? "",
    featured_image_alt: initial?.featured_image_alt ?? "",
    social_image_url: initial?.social_image_url ?? "",
    social_image_alt: initial?.social_image_alt ?? "",
    author_name: initial?.author_name ?? "",
    author_bio: initial?.author_bio ?? "",
    tags: initial?.tags ?? "",
    category_ids: initial?.category_ids ?? [],
    subcategory_ids: initial?.subcategory_ids ?? [],
    primary_category_id: initial?.primary_category_id ?? "",
    abstract: initial?.abstract ?? "",
    references_html: initial?.references_html ?? "",
    show_toc: initial?.show_toc ?? true,
    image_credit: initial?.image_credit ?? "",
    contributors: initial?.contributors ?? "",
    editorial_label: initial?.editorial_label ?? "",
    disclosure: initial?.disclosure ?? "",
    correction_note: initial?.correction_note ?? "",
  });
  // The editor must choose Blog Post or Article on purpose; nothing is guessed from length or topic.
  const [kindChosen, setKindChosen] = useState(Boolean(initial?.id) || initial?.in_blog === true);
  const [kindError, setKindError] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const { busy, saved, error, run } = useAdminAction();
  const router = useRouter();

  function set<K extends keyof ContentInput>(key: K, value: ContentInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // One save routine for every button. `status` overrides the dropdown (Publish /
  // Save as draft / Preview on a new item); a brand-new item moves to its own edit
  // page after "Saved" has shown, unless a draft is created quietly for Preview.
  async function persist(status?: string, navigate = true): Promise<string | null> {
    if (!kindChosen) { setKindError("Choose whether this is a Blog Post or an Article before saving."); return null; }
    setKindError("");
    const payload = status ? { ...values, status } : values;
    const result = await run(() => saveContent(payload));
    if (!result?.ok) return null;
    setSavedSlug(slugify(values.slug || values.title));
    if (status) set("status", status);
    if (result.id && !values.id) {
      set("id", result.id); // a second click before navigation updates, not duplicates
      if (navigate) setTimeout(() => router.push(`/admin/content/${result.id}`), 900);
    } else router.refresh();
    return result.id ?? values.id ?? null;
  }

  const submit = () => void persist();
  const base = values.in_blog ? "/blog" : "/articles";
  const previewNew = async () => ((await persist("draft", false)) ? `${base}/${slugify(values.slug || values.title)}` : null);
  const ensureContent = async () => values.id ?? (await persist("draft", false));

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
            if (!slugTouched || values.slug === slugify(values.title)) set("slug", slugify(e.target.value));
          }}
        />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Slug (this is the URL — /articles/your-slug)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
      </div>
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:140px;")}>
          <label>Type</label>
          <select
            className="input"
            value={values.type}
            onChange={(e) => {
              const type = e.target.value;
              set("type", type);
              if (!(SUBCATEGORIES[type] ?? []).includes(values.subcategory)) set("subcategory", "");
            }}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {SUBCATEGORIES[values.type] && (
          <div className="field" style={css("flex:1;min-width:160px;")}>
            <label>Subcategory</label>
            <select className="input" value={values.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
              <option value="">&mdash; General &mdash;</option>
              {SUBCATEGORIES[values.type].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="field" style={css("flex:1;min-width:140px;")}>
          <label>Status</label>
          <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {values.status === "scheduled" && (
        <div className="field" style={css("margin-bottom:var(--space-4);")}>
          <label htmlFor="cf-when">Publish on (your local time) *</label>
          <input id="cf-when" className="input" type="datetime-local" value={toLocalInput(values.published_at)} onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          <span style={css("font-size:12px;opacity:0.65;")}>The article goes live automatically at this time. Until then it is not public.</span>
        </div>
      )}

      <ImageUploadField label="Cover image" value={values.featured_image_url} onChange={(url) => set("featured_image_url", url)} />
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Cover image description (alt text)</label>
        <input className="input" value={values.featured_image_alt} onChange={(e) => set("featured_image_alt", e.target.value)} placeholder="Describe what the image shows" />
      </div>

      <div style={css("border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>CONTENT TYPE</div>
        <div role="radiogroup" aria-label="Content type" style={css("display:grid;gap:var(--space-2);margin-bottom:var(--space-3);")}>
          <label className="radio" style={css("margin:0;")}>
            <input type="radio" name="content-kind" checked={kindChosen && !values.in_blog} onChange={() => { setKindChosen(true); set("in_blog", false); }} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
            Article: substantial, structured, lasting writing. Lives at /articles/{values.slug || "your-slug"}
          </label>
          <label className="radio" style={css("margin:0;")}>
            <input type="radio" name="content-kind" checked={kindChosen && values.in_blog} onChange={() => { setKindChosen(true); set("in_blog", true); }} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
            Blog post: timely, flexible, regularly updated. Lives at /blog/{values.slug || "your-slug"}
          </label>
        </div>
        {kindError && <p role="alert" style={css("color:var(--color-danger,#b3261e);font-size:14px;margin:0 0 var(--space-3);")}>{kindError}</p>}
        {values.in_blog && (
          <>
            <CategoryPicker options={categories} categoryIds={values.category_ids ?? []} subcategoryIds={values.subcategory_ids ?? []} primaryId={values.primary_category_id ?? ""}
              onChange={(n) => setValues((v) => ({ ...v, category_ids: n.categoryIds, subcategory_ids: n.subcategoryIds, primary_category_id: n.primaryId }))} />
            <div style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-3);")}>
              <div className="field" style={css("flex:2;min-width:220px;")}>
                <label>Tags (comma separated)</label>
                <input className="input" value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="lagos, startups, interview" />
              </div>
            </div>
            <label className="radio" style={css("margin-bottom:var(--space-3);")}>
              <input type="checkbox" checked={values.blog_featured} onChange={(e) => set("blog_featured", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
              Featured story on the Blog page (the most recently published featured story is shown)
            </label>
            <div style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-3);")}>
              <div className="field" style={css("flex:1;min-width:200px;")}><label>Author name (blank = Omini Nfawa)</label><input className="input" value={values.author_name} onChange={(e) => set("author_name", e.target.value)} /></div>
              <div className="field" style={css("flex:2;min-width:220px;")}><label>Author bio (optional)</label><input className="input" value={values.author_bio} onChange={(e) => set("author_bio", e.target.value)} /></div>
            </div>
            <SquareImageField value={values.social_image_url} fallback={values.featured_image_url} onChange={(url) => set("social_image_url", url)} />
            <div className="field" style={css("margin-top:var(--space-2);")}>
              <label>Social image description (alt text)</label>
              <input className="input" value={values.social_image_alt} onChange={(e) => set("social_image_alt", e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div style={css("border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>EDITORIAL INTEGRITY</div>
        <div className="field" style={css("margin-bottom:var(--space-3);")}>
          <label>Label (shown on the piece)</label>
          <select className="input" value={values.editorial_label ?? ""} onChange={(e) => set("editorial_label", e.target.value)}>
            <option value="">None</option>
            <option value="news">News report</option><option value="analysis">Analysis</option><option value="explainer">Explainer</option>
            <option value="opinion">Opinion</option><option value="review">Review</option><option value="sponsored">Sponsored content</option><option value="fiction">Fiction</option>
          </select>
        </div>
        <div className="field" style={css("margin-bottom:var(--space-3);")}>
          <label>Disclosure (sponsorship, free products, material connections)</label>
          <textarea className="input" rows={2} value={values.disclosure ?? ""} onChange={(e) => set("disclosure", e.target.value)} />
        </div>
        <div className="field" style={css("margin-bottom:var(--space-3);")}>
          <label>Correction note (shown at the end of the piece)</label>
          <textarea className="input" rows={2} value={values.correction_note ?? ""} onChange={(e) => set("correction_note", e.target.value)} />
        </div>
        <div className="field" style={css("margin-bottom:var(--space-3);")}>
          <label>Image credit</label>
          <input className="input" value={values.image_credit ?? ""} onChange={(e) => set("image_credit", e.target.value)} />
        </div>
        {!values.in_blog && (
          <>
            <div className="field" style={css("margin-bottom:var(--space-3);")}>
              <label>Abstract or introduction (articles)</label>
              <textarea className="input" rows={3} value={values.abstract ?? ""} onChange={(e) => set("abstract", e.target.value)} />
            </div>
            <div className="field" style={css("margin-bottom:var(--space-3);")}>
              <label>Contributors</label>
              <input className="input" value={values.contributors ?? ""} onChange={(e) => set("contributors", e.target.value)} />
            </div>
            <label className="radio" style={css("margin-bottom:var(--space-3);")}>
              <input type="checkbox" checked={values.show_toc ?? true} onChange={(e) => set("show_toc", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
              Show a table of contents on long pieces
            </label>
            <div className="field">
              <label>References, notes and citations</label>
              <RichTextEditor value={values.references_html ?? ""} onChange={(h) => set("references_html", h)} />
            </div>
          </>
        )}
      </div>

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
        <RichTextEditor value={values.body} onChange={(html) => set("body", html)} placeholder="Write the piece…" />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Read time (minutes)</label>
        <input className="input" type="number" value={values.read_minutes ?? ""} onChange={(e) => set("read_minutes", e.target.value ? Number(e.target.value) : null)} />
      </div>

      <label className="radio" style={css("margin-bottom:var(--space-4);")}>
        <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        Featured (shown on the homepage, and first when sorted that way on Writing)
      </label>

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:2;")}>
          <label>Also published elsewhere (optional — e.g. a ResearchGate link)</label>
          <input className="input" value={values.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://www.researchgate.net/publication/…" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Link label (optional)</label>
          <input className="input" value={values.external_label} onChange={(e) => set("external_label", e.target.value)} placeholder="ResearchGate" />
        </div>
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
              <label>Price</label>
              <MoneyInput valueMinor={values.price_cents} currency={values.currency} onChange={(v) => set("price_cents", v)} />
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

      <ContentFilePanel contentId={values.id ?? null} ensureContent={ensureContent} initialAttachment={attachment} />

      <RelatedItemsPanel sourceType="content" sourceId={values.id ?? null} />

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <FormActions
        isNew={!values.id}
        busy={busy}
        saved={saved}
        disabled={!values.title || !values.slug}
        onSave={submit}
        onPublish={() => void persist("published")}
        onDraft={() => void persist("draft")}
        previewHref={savedSlug ? `${base}/${savedSlug}` : null}
        onPreviewNew={previewNew}
        onDelete={remove}
      />
    </div>
  );
}
