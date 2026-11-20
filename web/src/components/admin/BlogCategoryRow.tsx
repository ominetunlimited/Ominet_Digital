"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { saveBlogCategory, deleteBlogCategory, type CategoryInput } from "@/lib/admin/blog-category-actions";

export default function BlogCategoryRow({ initial }: { initial?: CategoryInput }) {
  const router = useRouter();
  const [v, setV] = useState<CategoryInput>(initial ?? { name: "", slug: "", description: "", order: 0, enabled: true });
  const act = useAdminAction();
  const del = useAdminAction();
  const set = <K extends keyof CategoryInput>(k: K, x: CategoryInput[K]) => setV((s) => ({ ...s, [k]: x }));
  return (
    <div style={css("display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);")}>
      <div className="field" style={css("flex:1 1 160px;")}><label>Name</label><input className="input" value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="field" style={css("flex:1 1 140px;")}><label>URL slug</label><input className="input" value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" /></div>
      <div className="field" style={css("flex:2 1 220px;")}><label>Description</label><input className="input" value={v.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="field" style={css("width:80px;")}><label>Order</label><input className="input" type="number" value={v.order} onChange={(e) => set("order", Number(e.target.value))} /></div>
      <label style={css("display:flex;gap:6px;align-items:center;font-size:13px;min-height:44px;")}><input type="checkbox" checked={v.enabled} onChange={(e) => set("enabled", e.target.checked)} /> Shown</label>
      <button type="button" className="btn btn-primary" disabled={act.busy} onClick={async () => { const r = await act.run(() => saveBlogCategory(v)); if (r?.ok) { if (!initial) setV({ name: "", slug: "", description: "", order: 0, enabled: true }); router.refresh(); } }}>{initial ? "Save" : "Add"}</button>
      {initial?.id && <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={del.busy} onClick={async () => { if (confirm(`Delete "${v.name}"? Articles keep existing but lose this category.`)) { const r = await del.run(() => deleteBlogCategory(initial.id!)); if (r?.ok) router.refresh(); } }}>Delete</button>}
      {(act.error || del.error) && <span role="alert" style={css("font-size:12px;color:var(--om-coral);flex-basis:100%;")}>{act.error || del.error}</span>}
    </div>
  );
}
