"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveBook, deleteBook, type BookInput } from "@/lib/admin/book-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/slug";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import FormActions from "@/components/admin/FormActions";
import { useRouter } from "next/navigation";
import MoneyInput from "@/components/admin/MoneyInput";
import ListInput from "@/components/admin/ListInput";
import BookFilesPanel from "@/components/admin/BookFilesPanel";
import type { BookFileRecord } from "@/lib/admin/book-file-actions";

const STATUSES = ["draft", "scheduled", "published", "archived"];

export default function BookForm({
  initial,
  files = [],
}: {
  initial?: Partial<BookInput> & { id?: string };
  files?: BookFileRecord[];
}) {
  const [values, setValues] = useState<BookInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    kind: initial?.kind ?? "Novel",
    year: initial?.year ?? "",
    author: initial?.author ?? "",
    publisher: initial?.publisher ?? "",
    isbn: initial?.isbn ?? "",
    category: initial?.category ?? "",
    tags: initial?.tags ?? [],
    publication_date: initial?.publication_date ?? "",
    page_count: initial?.page_count ?? null,
    page_count_source: initial?.page_count_source ?? "",
    excerpt: initial?.excerpt ?? "",
    description: initial?.description ?? "",
    author_note: initial?.author_note ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    og_image_url: initial?.og_image_url ?? "",
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
    sales_mode: initial?.sales_mode ?? "external_only",
    price_cents: initial?.price_cents ?? null,
    formats: initial?.formats ?? [],
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    purchaseLinks: initial?.purchaseLinks ?? [],
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [savedSlug, setSavedSlug] = useState(initial?.slug ?? "");
  const { busy, saved, error, run } = useAdminAction();
  const router = useRouter();

  function set<K extends keyof BookInput>(key: K, value: BookInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateLink(i: number, patch: Partial<BookInput["purchaseLinks"][number]>) {
    set("purchaseLinks", values.purchaseLinks.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  // One save routine for every button. `status` overrides the dropdown (used by
  // Publish / Save as draft / Preview on a new book); `navigate` is false when a
  // draft is created in the background so the form you're filling in stays put.
  async function persist(status?: string, navigate = true): Promise<string | null> {
    const payload = status ? { ...values, status } : values;
    const result = await run(() => saveBook(payload));
    if (!result?.ok) return null;
    const slug = slugify(values.slug || values.title);
    setSavedSlug(slug);
    if (status) set("status", status);
    if (result.id && !values.id) {
      set("id", result.id);
      if (navigate) setTimeout(() => router.push(`/admin/books/${result.id}`), 900);
    } else router.refresh();
    return result.id ?? values.id ?? null;
  }

  const submit = () => void persist();
  // Files are attached to a book, so choosing one on a new book quietly saves a private draft first.
  const ensureBook = async () => values.id ?? (await persist("draft", false));
  const previewNew = async () => ((await persist("draft", false)) ? `/books/${slugify(values.slug || values.title)}` : null);

  async function remove() {
    if (!values.id || !confirm(`Delete "${values.title}"? This can't be undone.`)) return;
    await run(() => deleteBook(values.id!));
  }

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Title</label>
        <input
          className="input"
          value={values.title}
          onChange={(e) => {
            const title = e.target.value;
            // Keep the link in step with the title until you deliberately write your own.
            const following = !slugTouched || values.slug === slugify(values.title);
            setValues((v) => ({ ...v, title, ...(following ? { slug: slugify(title) } : {}) }));
          }}
        />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Web address (made from the title automatically)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
        <div style={css("font-size:12px;opacity:0.55;margin-top:4px;overflow-wrap:anywhere;")}>
          Your book will live at /books/{slugify(values.slug) || "…"} — only change this if you want a different link.
        </div>
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
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Author</label>
          <input className="input" value={values.author} onChange={(e) => set("author", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Publisher</label>
          <input className="input" value={values.publisher} onChange={(e) => set("publisher", e.target.value)} />
        </div>
      </div>
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>ISBN</label>
          <input className="input" value={values.isbn} onChange={(e) => set("isbn", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Publication date</label>
          <input className="input" type="date" value={values.publication_date} onChange={(e) => set("publication_date", e.target.value)} />
        </div>
      </div>
      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Category</label>
          <input className="input" value={values.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Tags (comma-separated)</label>
          <ListInput value={values.tags} onChange={(list) => set("tags", list)} />
        </div>
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);max-width:240px;")}>
        <label>
          Page count{values.page_count_source && values.page_count_source !== "manual" ? ` (read from the ${values.page_count_source.toUpperCase()} file)` : values.page_count ? " (entered by hand)" : " (leave blank if unknown)"}
        </label>
        <input
          className="input"
          inputMode="numeric"
          value={values.page_count ?? ""}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
            setValues((v) => ({ ...v, page_count: Number.isFinite(n) && n > 0 ? n : null, page_count_source: "manual" }));
          }}
        />
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>PRICE &amp; SALE</div>
      <div className="field" style={css("margin-bottom:var(--space-3);")}>
        <label>How is this book made available?</label>
        <select className="input" value={values.sales_mode} onChange={(e) => set("sales_mode", e.target.value)}>
          <option value="external_only">External links only (sold elsewhere)</option>
          <option value="free_download">Free download from this site (price 0)</option>
          <option value="direct_sale">Sold here through Paystack</option>
        </select>
      </div>
      {values.sales_mode === "direct_sale" && (
        <div className="field" style={css("margin-bottom:var(--space-3);max-width:240px;")}>
          <label>Price (Naira)</label>
          <MoneyInput valueMinor={values.price_cents} currency="NGN" onChange={(m) => set("price_cents", m)} />
        </div>
      )}
      <p style={css("font-size:12px;opacity:0.6;margin:0 0 var(--space-6);")}>
        External retailer links below work in every mode and are independent of this choice. A click on one is never counted as a sale here.
      </p>

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Excerpt (shown as a short teaser everywhere; the full text also shows on the book page if it&apos;s more than a sentence or two)</label>
        <textarea className="input" rows={3} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Author&apos;s Note (optional — your own words about the book, shown on its page)</label>
        <textarea className="input" rows={4} value={values.author_note} onChange={(e) => set("author_note", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Formats (comma-separated)</label>
        <ListInput value={values.formats} onChange={(list) => set("formats", list)} placeholder="Ebook, Paperback, Audio" />
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

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SEARCH &amp; SOCIAL PREVIEW</div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO title (blank = the book title)</label>
        <input className="input" value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO description</label>
        <textarea className="input" rows={2} value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
      </div>
      <ImageUploadField label="Social preview image (blank = the cover)" value={values.og_image_url} onChange={(url) => set("og_image_url", url)} />

      <BookFilesPanel
        bookId={values.id ?? null}
        ensureBook={ensureBook}
        initialFiles={files}
        onUsePageCount={(n, src) => setValues((v) => ({ ...v, page_count: n, page_count_source: src }))}
        onUseCover={(url) => set("cover_image_url", url)}
      />

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <FormActions
        isNew={!values.id}
        busy={busy}
        saved={saved}
        disabled={!values.title || !values.slug}
        onSave={submit}
        onPublish={() => void persist("published")}
        onDraft={() => void persist("draft")}
        previewHref={savedSlug ? `/books/${savedSlug}` : null}
        onPreviewNew={previewNew}
        onDelete={remove}
      />
    </div>
  );
}
