"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveService, deleteService, type ServiceInput, type FaqItem } from "@/lib/admin/service-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/admin/ImageUploadField";
import MoneyInput from "@/components/admin/MoneyInput";
import { slugify } from "@/lib/slug";

const PRICING_MODES = [
  { value: "fixed", label: "Fixed price" },
  { value: "hourly", label: "Hourly rate" },
  { value: "package", label: "Package price" },
  { value: "quote", label: "Quote on request (no price shown)" },
];
const LOCATION_MODES = [
  { value: "remote", label: "Remote" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];
const STATUSES = ["draft", "published", "archived"];

export default function ServiceForm({ initial }: { initial?: Partial<ServiceInput> & { id?: string } }) {
  const [values, setValues] = useState<ServiceInput>({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    short_description: initial?.short_description ?? "",
    full_description: initial?.full_description ?? "",
    featured_image_url: initial?.featured_image_url ?? "",
    gallery: initial?.gallery ?? [],
    category: initial?.category ?? "",
    price_cents: initial?.price_cents ?? null,
    currency: initial?.currency ?? "NGN",
    pricing_mode: initial?.pricing_mode ?? "quote",
    duration: initial?.duration ?? "",
    availability: initial?.availability ?? "",
    location_mode: initial?.location_mode ?? "remote",
    booking_enabled: initial?.booking_enabled ?? true,
    requirements: initial?.requirements ?? "",
    faq: initial?.faq ?? [],
    external_booking_url: initial?.external_booking_url ?? "",
    cta_label: initial?.cta_label ?? "",
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    display_order: initial?.display_order ?? 0,
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
    og_image_url: initial?.og_image_url ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const { busy, saved, error, run } = useAdminAction();
  const router = useRouter();

  function set<K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateFaq(i: number, patch: Partial<FaqItem>) {
    set("faq", values.faq.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function submit() {
    const result = await run(() => saveService(values));
    if (!result?.ok) return;
    if (result.id && !values.id) {
      set("id", result.id);
      setTimeout(() => router.push(`/admin/services/${result.id}`), 900);
    } else router.refresh();
  }

  async function remove() {
    if (!values.id || !confirm(`Delete "${values.title}"? This can't be undone.`)) return;
    await run(() => deleteService(values.id!));
  }

  const needsPrice = values.pricing_mode !== "quote";

  return (
    <div style={css("max-width:640px;")}>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Service name</label>
        <input
          className="input"
          value={values.title}
          onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }}
        />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Slug (this is the URL — /services/your-slug)</label>
        <input
          className="input"
          value={values.slug}
          onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
          onBlur={(e) => set("slug", slugify(e.target.value))}
        />
      </div>

      {/* A5 portrait (≈1:1.414) — the site-wide ratio for editorial/service cover images. */}
      <ImageUploadField label="Featured image (A5 portrait)" value={values.featured_image_url} onChange={(url) => set("featured_image_url", url)} />
      {values.featured_image_url && (
        <div style={css("width:120px;aspect-ratio:1/1.414;border-radius:var(--radius-sm);overflow:hidden;margin:calc(-1 * var(--space-3)) 0 var(--space-4);")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={values.featured_image_url} alt="" style={css("width:100%;height:100%;object-fit:cover;")} />
        </div>
      )}

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Short description (for cards/listings)</label>
        <textarea className="input" rows={2} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Full description</label>
        <textarea className="input" rows={8} value={values.full_description} onChange={(e) => set("full_description", e.target.value)} placeholder="Paragraphs separated by a blank line." />
      </div>

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Category</label>
          <input className="input" value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="Writing, Photography, Video…" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Status</label>
          <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Pricing mode</label>
          <select className="input" value={values.pricing_mode} onChange={(e) => set("pricing_mode", e.target.value)}>
            {PRICING_MODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {needsPrice && (
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

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>Duration</label>
          <input className="input" value={values.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 2 hours, 3-5 days" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Availability</label>
          <input className="input" value={values.availability} onChange={(e) => set("availability", e.target.value)} placeholder="e.g. Booking 2 weeks out" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>Location</label>
          <select className="input" value={values.location_mode} onChange={(e) => set("location_mode", e.target.value)}>
            {LOCATION_MODES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Requirements (what the client should bring/prepare)</label>
        <textarea className="input" rows={2} value={values.requirements} onChange={(e) => set("requirements", e.target.value)} />
      </div>

      <label className="radio" style={css("margin-bottom:var(--space-4);display:block;")}>
        <input type="checkbox" checked={values.booking_enabled} onChange={(e) => set("booking_enabled", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        Allow booking requests for this service
      </label>

      <div style={css("display:flex;gap:var(--space-4);margin-bottom:var(--space-4);")}>
        <div className="field" style={css("flex:1;")}>
          <label>CTA label (optional — defaults per booking setting)</label>
          <input className="input" value={values.cta_label} onChange={(e) => set("cta_label", e.target.value)} placeholder="Book this service, Request a quote…" />
        </div>
        <div className="field" style={css("flex:1;")}>
          <label>External booking URL (optional — instead of the built-in form)</label>
          <input className="input" value={values.external_booking_url} onChange={(e) => set("external_booking_url", e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin:var(--space-6) 0 var(--space-3);")}>FAQ</div>
      <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-3);")}>
        {values.faq.map((f, i) => (
          <div key={i} className="card" style={css("gap:var(--space-2);")}>
            <input className="input" placeholder="Question" value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} />
            <textarea className="input" rows={2} placeholder="Answer" value={f.answer} onChange={(e) => updateFaq(i, { answer: e.target.value })} />
            <button type="button" className="btn btn-ghost" style={css("align-self:flex-start;color:var(--om-coral);")} onClick={() => set("faq", values.faq.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary" style={css("margin-bottom:var(--space-6);")} onClick={() => set("faq", [...values.faq, { question: "", answer: "" }])}>
        Add FAQ item
      </button>

      <label className="radio" style={css("margin-bottom:var(--space-6);display:block;")}>
        <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        Featured on Services page
      </label>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SEO</div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO title (optional — falls back to service name)</label>
        <input className="input" value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>SEO description (optional — falls back to short description)</label>
        <textarea className="input" rows={2} value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
      </div>
      <ImageUploadField label="Social share image" value={values.og_image_url} onChange={(url) => set("og_image_url", url)} />

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-3);")}>
        <SaveButton busy={busy} saved={saved} disabled={!values.title || !values.slug} idleLabel={values.id ? "Save changes" : "Create"} onClick={submit} />
        {values.id && (
          <button type="button" className="btn btn-secondary" onClick={remove} disabled={busy} style={css("color:var(--om-coral);border-color:var(--om-coral);")}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
