"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { saveAdvertiser, deleteAdvertiser } from "@/lib/admin/ad-cms-actions";

export type AdvertiserRow = { id: string; name: string; website: string; contactName: string; contactEmail: string; notes: string; status: "active" | "archived"; campaigns: number; ads: number };

type Draft = Omit<AdvertiserRow, "id" | "campaigns" | "ads"> & { key: string; id?: string; campaigns: number; ads: number };

let n = 0;
const blank = (): Draft => ({ key: `new-${++n}`, name: "", website: "", contactName: "", contactEmail: "", notes: "", status: "active", campaigns: 0, ads: 0 });

function Row({ draft, onChange, onRemoved }: { draft: Draft; onChange: (d: Draft) => void; onRemoved: () => void }) {
  const { busy, saved, error, run } = useAdminAction();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  async function save(patch: Partial<Draft> = {}) {
    const next = { ...draft, ...patch };
    const res = await run(() => saveAdvertiser({ ...next, status: next.status }));
    if (res?.ok) onChange({ ...next, id: res.id });
  }
  async function remove() {
    if (!draft.id) return onRemoved();
    const extra = draft.campaigns || draft.ads ? ` This also permanently removes its ${draft.campaigns} campaign(s) and ${draft.ads} ad(s), and their statistics.` : "";
    if (!confirm(`Delete advertiser "${draft.name}"?${extra} This can't be undone. (Archive instead to keep the history.)`)) return;
    const res = await run(() => deleteAdvertiser(draft.id!));
    if (res?.ok) onRemoved();
  }

  return (
    <div className="card" style={css(`gap:var(--space-3);${draft.status === "archived" ? "opacity:0.7;" : ""}`)}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Advertiser / company</label>
          <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Website</label>
          <input className="input" value={draft.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:180px;")}>
          <label>Contact person</label>
          <input className="input" value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:180px;")}>
          <label>Contact email (private)</label>
          <input className="input" type="email" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Private notes</label>
        <textarea className="input" rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {draft.id && <div style={css("font-size:12px;opacity:0.6;")}>{draft.campaigns} campaign(s) · {draft.ads} ad(s) · {draft.status === "archived" ? "Archived — its ads are hidden" : "Active"}</div>}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add advertiser"} onClick={() => save()} disabled={!draft.name.trim()} />
        {draft.id && (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => save({ status: draft.status === "archived" ? "active" : "archived" })}>
            {draft.status === "archived" ? "Restore" : "Archive"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={busy} onClick={remove}>Delete</button>
      </div>
    </div>
  );
}

export default function AdvertisersManager({ initial }: { initial: AdvertiserRow[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map((r) => ({ ...r, key: r.id })));
  return (
    <div style={css("max-width:760px;display:grid;gap:var(--space-4);")}>
      {rows.length === 0 && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>No advertisers yet. Add the person or company you&apos;re advertising for, then create a campaign for them.</p>}
      {rows.map((r) => (
        <Row key={r.key} draft={r} onChange={(d) => setRows((l) => l.map((x) => (x.key === r.key ? d : x)))} onRemoved={() => setRows((l) => l.filter((x) => x.key !== r.key))} />
      ))}
      <div><button type="button" className="btn btn-secondary" onClick={() => setRows((l) => [...l, blank()])}>+ Add an advertiser</button></div>
    </div>
  );
}
