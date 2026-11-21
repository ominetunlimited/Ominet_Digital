"use client";

import { css } from "@/lib/css";

export type CatOption = { id: string; name: string; parent_id: string | null };

type Next = { categoryIds: string[]; subcategoryIds: string[]; primaryId: string };

/**
 * Category choice for a blog post, as three plain dropdowns:
 *  1. Primary category (shown with the post and used for breadcrumbs),
 *  2. Additional categories (optional, added one at a time),
 *  3. Subcategories (only those under the categories chosen above).
 * Nothing here is shown on the public site until it is chosen for a post.
 */
export default function CategoryPicker({ options, categoryIds, subcategoryIds, primaryId, onChange }: {
  options: CatOption[]; categoryIds: string[]; subcategoryIds: string[]; primaryId: string; onChange: (next: Next) => void;
}) {
  const mains = options.filter((o) => !o.parent_id);
  const name = (id: string) => options.find((o) => o.id === id)?.name ?? "";
  const extra = categoryIds.filter((id) => id !== primaryId);
  const subChoices = options.filter((o) => o.parent_id && categoryIds.includes(o.parent_id) && !subcategoryIds.includes(o.id));

  function setPrimary(id: string) {
    if (!id) return onChange({ categoryIds: [], subcategoryIds: [], primaryId: "" });
    const ids = categoryIds.includes(id) ? categoryIds : [id, ...categoryIds];
    onChange({ categoryIds: ids, subcategoryIds, primaryId: id });
  }
  function addExtra(id: string) { if (id) onChange({ categoryIds: [...categoryIds, id], subcategoryIds, primaryId }); }
  function removeMain(id: string) {
    onChange({ categoryIds: categoryIds.filter((x) => x !== id), subcategoryIds: subcategoryIds.filter((s) => options.find((o) => o.id === s)?.parent_id !== id), primaryId });
  }
  function addSub(id: string) { if (id) onChange({ categoryIds, primaryId, subcategoryIds: [...subcategoryIds, id] }); }
  function removeSub(id: string) { onChange({ categoryIds, primaryId, subcategoryIds: subcategoryIds.filter((x) => x !== id) }); }

  const chip = (label: string, onRemove: () => void) => (
    <span key={label} style={css("display:inline-flex;align-items:center;gap:6px;font-size:13px;padding:4px 10px;border:1px solid var(--color-divider);border-radius:999px;")}>
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} style={css("border:0;background:none;cursor:pointer;font-size:14px;line-height:1;padding:0;")}>&times;</button>
    </span>
  );

  return (
    <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-3);")}>
      <div className="field">
        <label>Primary category</label>
        <select className="input" value={primaryId} onChange={(e) => setPrimary(e.target.value)}>
          <option value="">Choose a category</option>
          {mains.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {primaryId && (
        <div className="field">
          <label>Additional categories (optional)</label>
          <select className="input" value="" onChange={(e) => addExtra(e.target.value)}>
            <option value="">Add another category</option>
            {mains.filter((m) => !categoryIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {extra.length > 0 && <div style={css("display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;")}>{extra.map((id) => chip(name(id), () => removeMain(id)))}</div>}
        </div>
      )}
      {categoryIds.length > 0 && (
        <div className="field">
          <label>Subcategories (optional)</label>
          <select className="input" value="" onChange={(e) => addSub(e.target.value)} disabled={subChoices.length === 0}>
            <option value="">{subChoices.length ? "Add a subcategory" : "No more subcategories for the chosen categories"}</option>
            {categoryIds.map((cid) => {
              const kids = subChoices.filter((o) => o.parent_id === cid);
              return kids.length ? <optgroup key={cid} label={name(cid)}>{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</optgroup> : null;
            })}
          </select>
          {subcategoryIds.length > 0 && <div style={css("display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;")}>{subcategoryIds.map((id) => chip(name(id), () => removeSub(id)))}</div>}
        </div>
      )}
    </div>
  );
}
