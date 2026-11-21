"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { saveBlogCategory, deleteBlogCategory, mergeBlogCategory, type CategoryInput } from "@/lib/admin/blog-category-actions";

export type ParentOption = { id: string; name: string };

export default function BlogCategoryRow({ initial, parents = [], mergeTargets = [], postCount, indent = false }: {
  initial?: CategoryInput; parents?: ParentOption[]; mergeTargets?: ParentOption[]; postCount?: number; indent?: boolean;
}) {
  const router = useRouter();
  const blank: CategoryInput = { name: "", slug: "", description: "", order: 0, enabled: true, parentId: "", seoTitle: "", seoDescription: "", imageUrl: "", showWhenEmpty: false };
  const [v, setV] = useState<CategoryInput>(initial ?? blank);
  const [mergeInto, setMergeInto] = useState("");
  const act = useAdminAction();
  const del = useAdminAction();
  const mrg = useAdminAction();
  const set = <K extends keyof CategoryInput>(k: K, x: CategoryInput[K]) => setV((s) => ({ ...s, [k]: x }));
  return (
    <div style={css(`display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);${indent ? "margin-left:var(--space-5);" : ""}`)}>
      <div className="field" style={css("flex:1 1 160px;")}><label>Name</label><input className="input" value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="field" style={css("flex:1 1 140px;")}><label>URL slug</label><input className="input" value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" /></div>
      <div className="field" style={css("flex:1 1 160px;")}>
        <label>Parent</label>
        <select className="input" value={v.parentId ?? ""} onChange={(e) => set("parentId", e.target.value)}>
          <option value="">Main category</option>
          {parents.filter((p) => p.id !== v.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="field" style={css("width:80px;")}><label>Order</label><input className="input" type="number" value={v.order} onChange={(e) => set("order", Number(e.target.value))} /></div>
      <label style={css("display:flex;gap:6px;align-items:center;font-size:13px;min-height:44px;")}><input type="checkbox" checked={v.enabled} onChange={(e) => set("enabled", e.target.checked)} /> Active</label>
      {postCount !== undefined && <span style={css("font-size:12px;opacity:0.6;min-height:44px;display:flex;align-items:center;")}>{postCount} post{postCount === 1 ? "" : "s"}</span>}
      <button type="button" className="btn btn-primary" disabled={act.busy} onClick={async () => { const r = await act.run(() => saveBlogCategory(v)); if (r?.ok) { if (!initial) setV(blank); router.refresh(); } }}>{act.busy ? "Saving…" : initial ? "Save" : "Add"}</button>
      {initial?.id && <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={del.busy} onClick={async () => { if (!confirm(`Delete "${v.name}"? This only works for a category no post uses.`)) return; const r = await del.run(() => deleteBlogCategory(initial.id!)); if (r?.ok) router.refresh(); }}>Delete</button>}
      <details style={css("flex-basis:100%;")}>
        <summary style={css("font-size:12px;cursor:pointer;opacity:0.7;")}>Description, SEO, visibility and merge</summary>
        <div style={css("display:grid;gap:8px;margin-top:8px;")}>
          <div className="field"><label>Description (shown on the category page)</label><input className="input" value={v.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="field"><label>SEO title</label><input className="input" value={v.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} /></div>
          <div className="field"><label>SEO description</label><input className="input" value={v.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} /></div>
          <div className="field"><label>Image URL (optional)</label><input className="input" value={v.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} /></div>
          <label style={css("display:flex;gap:6px;align-items:center;font-size:13px;")}><input type="checkbox" checked={!!v.showWhenEmpty} onChange={(e) => set("showWhenEmpty", e.target.checked)} /> Show even when it has no published posts (by default empty categories stay hidden)</label>
          {initial?.id && mergeTargets.length > 0 && (
            <div style={css("display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;")}>
              <div className="field" style={css("flex:1 1 220px;")}>
                <label>Merge into (moves every post, then removes this category)</label>
                <select className="input" value={mergeInto} onChange={(e) => setMergeInto(e.target.value)}>
                  <option value="">Choose a category</option>
                  {mergeTargets.filter((p) => p.id !== initial.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-secondary" disabled={mrg.busy || !mergeInto} onClick={async () => { if (!confirm(`Merge "${v.name}" into the chosen category? This cannot be undone.`)) return; const r = await mrg.run(() => mergeBlogCategory(initial.id!, mergeInto)); if (r?.ok) router.refresh(); }}>Merge</button>
            </div>
          )}
        </div>
      </details>
      {(act.error || del.error || mrg.error) && <span role="alert" style={css("font-size:12px;color:var(--om-coral);flex-basis:100%;")}>{act.error || del.error || mrg.error}</span>}
    </div>
  );
}
