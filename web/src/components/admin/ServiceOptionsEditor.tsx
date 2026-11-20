"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { saveServiceOption, deleteServiceOption, type OptionInput } from "@/lib/admin/service-option-actions";
import { useRouter } from "next/navigation";

export type EditableOption = {
  id: string; key: string; label: string; group: string | null; description: string | null; requirements: string | null; duration: string | null;
  priceMode: string; priceCents: number | null; priceMaxCents: number | null; officialFeeCents: number | null; officialFeeNote: string | null; currency: string; active: boolean; order: number;
};
const major = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));

function OptionCard({ serviceId, o, onDone }: { serviceId: string; o?: EditableOption; onDone: () => void }) {
  const [v, setV] = useState<OptionInput>({
    id: o?.id, serviceId, key: o?.key, label: o?.label ?? "", group: o?.group ?? "", description: o?.description ?? "", requirements: o?.requirements ?? "", duration: o?.duration ?? "",
    priceMode: o?.priceMode ?? "quote", price: major(o?.priceCents ?? null), priceMax: major(o?.priceMaxCents ?? null), officialFee: major(o?.officialFeeCents ?? null),
    officialFeeNote: o?.officialFeeNote ?? "", currency: o?.currency ?? "NGN", active: o?.active ?? true, order: o?.order ?? 0,
  });
  const act = useAdminAction();
  const del = useAdminAction();
  const set = <K extends keyof OptionInput>(k: K, val: OptionInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const L = css("display:block;font-size:12px;font-weight:600;margin-bottom:3px;");
  return (
    <div style={css("border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-3);margin-bottom:var(--space-3);display:grid;gap:var(--space-2);")}>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-2);")}>
        <div><label style={L}>Name</label><input className="input" value={v.label} onChange={(e) => set("label", e.target.value)} /></div>
        <div><label style={L}>Group (optional)</label><input className="input" value={v.group} onChange={(e) => set("group", e.target.value)} /></div>
        <div><label style={L}>Estimated processing time</label><input className="input" value={v.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 72 hours (leave blank if unknown)" /></div>
        <div><label style={L}>Order</label><input className="input" type="number" value={v.order} onChange={(e) => set("order", Number(e.target.value))} /></div>
        <div><label style={L}>Professional fee type</label>
          <select className="input" value={v.priceMode} onChange={(e) => set("priceMode", e.target.value)}><option value="quote">Quote on request</option><option value="fixed">Fixed</option><option value="from">Starting from</option><option value="range">Range</option></select></div>
        {v.priceMode !== "quote" && <div><label style={L}>{v.priceMode === "range" ? "Minimum fee" : "Professional fee"}</label><input className="input" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} /></div>}
        {v.priceMode === "range" && <div><label style={L}>Maximum fee</label><input className="input" inputMode="decimal" value={v.priceMax} onChange={(e) => set("priceMax", e.target.value)} /></div>}
        <div><label style={L}>Official charge (optional, only if verified)</label><input className="input" inputMode="decimal" value={v.officialFee} onChange={(e) => set("officialFee", e.target.value)} /></div>
        <div><label style={L}>Currency</label><input className="input" maxLength={3} value={v.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
      </div>
      <div><label style={L}>Short description (shown to customers)</label><input className="input" value={v.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div><label style={L}>Official charge note (for example where the figure was checked)</label><input className="input" value={v.officialFeeNote} onChange={(e) => set("officialFeeNote", e.target.value)} /></div>
      <div><label style={L}>Requirements (shown to customers)</label><textarea className="input" rows={2} value={v.requirements} onChange={(e) => set("requirements", e.target.value)} /></div>
      <div style={css("display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;")}>
        <label style={css("display:flex;gap:6px;align-items:center;font-size:13px;")}><input type="checkbox" checked={v.active} onChange={(e) => set("active", e.target.checked)} /> Active (bookable by customers)</label>
        <button type="button" className="btn btn-primary" disabled={act.busy} onClick={async () => { const r = await act.run(() => saveServiceOption(v)); if (r?.ok) onDone(); }}>{act.busy ? "Saving…" : o ? "Save option" : "Add option"}</button>
        {o && <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={del.busy} onClick={async () => { if (confirm(`Delete "${o.label}"? Existing requests keep their own copy of the name.`)) { const r = await del.run(() => deleteServiceOption(o.id)); if (r?.ok) onDone(); } }}>Delete</button>}
        {act.saved && <span role="status" style={css("font-size:12px;color:var(--om-cyan);")}>Saved</span>}
        {(act.error || del.error) && <span role="alert" style={css("font-size:12px;color:var(--om-coral);")}>{act.error || del.error}</span>}
      </div>
    </div>
  );
}

export default function ServiceOptionsEditor({ serviceId, options }: { serviceId: string; options: EditableOption[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const refresh = () => { setAdding(false); router.refresh(); };
  return (
    <section style={css("max-width:900px;margin-top:var(--space-8);")} aria-labelledby="opts-h">
      <h2 id="opts-h" style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-2);")}>Service options</h2>
      <p style={css("font-size:13px;opacity:0.7;margin:0 0 var(--space-4);")}>Options customers choose between inside this one service. Prices, times and availability are edited here and appear everywhere automatically. Nothing is filled in for you: leave a fee as “Quote on request” and leave a time blank until you have verified it.</p>
      {options.map((o) => <OptionCard key={o.id} serviceId={serviceId} o={o} onDone={refresh} />)}
      {adding ? <OptionCard serviceId={serviceId} onDone={refresh} /> : <button type="button" className="btn btn-secondary" onClick={() => setAdding(true)}>Add an option</button>}
    </section>
  );
}
