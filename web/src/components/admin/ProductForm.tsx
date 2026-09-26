"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveProduct, deleteProduct, type ProductInput } from "@/lib/admin/product-actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import MoneyInput from "@/components/admin/MoneyInput";
import { slugify } from "@/lib/slug";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { useRouter } from "next/navigation";

const ACCESS = [
  { value: "free", label: "Free download" },
  { value: "paid", label: "Paid download (checkout here)" },
  { value: "external", label: "External redirect (e.g. Selar, Gumroad)" },
  { value: "affiliate", label: "Affiliate product" },
  { value: "gated", label: "Gated (sign in to access)" },
];
const STATUSES = ["draft", "scheduled", "published", "archived"];

export default function ProductForm({ initial }: { initial?: Partial<ProductInput> & { id?: string } }) {
  const [values, setValues] = useState<ProductInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    price_cents: initial?.price_cents ?? null,
    currency: initial?.currency ?? "NGN",
    access: initial?.access ?? "paid",
    external_url: initial?.external_url ?? "",
    external_label: initial?.external_label ?? "",
    affiliate_disclosure: initial?.affiliate_disclosure ?? "",
    status: initial?.status ?? "draft",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const { busy, saved, error, run } = useAdminAction();
  const router = useRouter();

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit() {
    const result = await run(() => saveProduct(values));
    if (!result?.ok) return;
    if (result.id && !values.id) {
      set("id", result.id);
      setTimeout(() => router.push(`/admin/store/${result.id}`), 900);
    } else router.refresh();
  }

  async function remove() {
    if (!values.id || !confirm(`Delete "${values.title}"? This can't be undone.`)) return;
    await run(() => deleteProduct(values.id!));
  }

  const needsPrice = values.access === "paid" || values.access === "gated";
  const needsExternal = values.access === "external" || values.access === "affiliate";

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Title</label>
        <input
          className="input"
          value={values.title}
          onChange={(e) => { set("title", e.target.value); if (!slugTouched || values.slug === slugify(values.title)) set("slug", slugify(e.target.value)); }}
        />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Slug (this is the URL — /store/your-slug)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
      </div>

      <ImageUploadField label="Product image" value={values.image_url} onChange={(url) => set("image_url", url)} />

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Description</label>
        <textarea className="input" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Access</label>
        <select className="input" value={values.access} onChange={(e) => set("access", e.target.value)}>
          {ACCESS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {needsPrice && (
        <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
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
        </div>
      )}

      {needsExternal && (
        <>
          <div className="field" style={css("margin-bottom:var(--space-4);")}>
            <label>{values.access === "affiliate" ? "Affiliate link" : "External URL"} (e.g. your Selar product link)</label>
            <input className="input" value={values.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://selar.co/…" />
          </div>
          <div className="field" style={css("margin-bottom:var(--space-4);")}>
            <label>Button label (optional — e.g. &quot;Buy on Selar&quot;)</label>
            <input className="input" value={values.external_label} onChange={(e) => set("external_label", e.target.value)} />
          </div>
        </>
      )}

      {values.access === "affiliate" && (
        <div className="field" style={css("margin-bottom:var(--space-4);")}>
          <label>Affiliate disclosure (shown publicly next to the item)</label>
          <input className="input" value={values.affiliate_disclosure} onChange={(e) => set("affiliate_disclosure", e.target.value)} placeholder="This is an affiliate link — I may earn a commission." />
        </div>
      )}

      <div className="field" style={css("margin-bottom:var(--space-6);")}>
        <label>Status</label>
        <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-3);")}>
        <SaveButton busy={busy} saved={saved} disabled={!values.title || !values.slug} idleLabel={values.id ? "Save changes" : "Create"} onClick={submit} />
        {values.id && values.status === "published" ? (
          <a href="/store" target="_blank" rel="noopener" className="btn btn-secondary" style={css("text-decoration:none;")}>View in store ↗</a>
        ) : (
          <button type="button" className="btn btn-secondary" disabled title="Products have no page of their own — they appear in the Store once published">Preview</button>
        )}
        {values.id && (
          <button type="button" className="btn btn-secondary" onClick={remove} disabled={busy} style={css("color:var(--om-coral);border-color:var(--om-coral);")}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
