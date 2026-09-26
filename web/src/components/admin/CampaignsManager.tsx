"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import MoneyInput from "@/components/admin/MoneyInput";
import { CAMPAIGN_STATUSES, ctr } from "@/lib/ad-validate";
import { saveCampaign, setCampaignStatus, deleteCampaign } from "@/lib/admin/ad-cms-actions";

export type CampaignRow = {
  id: string;
  advertiserId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  feeCents: number | null;
  feeNote: string;
  status: string;
  ads: number;
  impressions30d: number;
  clicks30d: number;
};
type Advertiser = { id: string; name: string };
type Draft = Omit<CampaignRow, "id"> & { key: string; id?: string };

let n = 0;
const blank = (advertiserId: string): Draft => ({ key: `new-${++n}`, advertiserId, name: "", startsOn: "", endsOn: "", feeCents: null, feeNote: "", status: "draft", ads: 0, impressions30d: 0, clicks30d: 0 });

function Row({ draft, advertisers, onChange, onRemoved }: { draft: Draft; advertisers: Advertiser[]; onChange: (d: Draft) => void; onRemoved: () => void }) {
  const { busy, saved, error, run } = useAdminAction();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  async function save() {
    const res = await run(() => saveCampaign(draft));
    if (res?.ok) onChange({ ...draft, id: res.id });
  }
  async function quick(status: string) {
    if (!draft.id) return set("status", status);
    const res = await run(() => setCampaignStatus(draft.id!, status));
    if (res?.ok) onChange({ ...draft, status });
  }
  async function remove() {
    if (!draft.id) return onRemoved();
    const extra = draft.ads ? ` This also permanently removes its ${draft.ads} ad(s) and their statistics.` : "";
    if (!confirm(`Delete campaign "${draft.name}"?${extra} This can't be undone. (Archive instead to keep the history.)`)) return;
    const res = await run(() => deleteCampaign(draft.id!));
    if (res?.ok) onRemoved();
  }

  return (
    <div className="card" style={css(`gap:var(--space-3);${draft.status === "archived" ? "opacity:0.7;" : ""}`)}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Campaign name</label>
          <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Advertiser</label>
          <select className="input" value={draft.advertiserId} onChange={(e) => set("advertiserId", e.target.value)}>
            <option value="">Choose…</option>
            {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:150px;")}>
          <label>Starts (optional)</label>
          <input className="input" type="date" value={draft.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:150px;")}>
          <label>Ends (optional)</label>
          <input className="input" type="date" value={draft.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:150px;")}>
          <label>Agreed fee (Naira)</label>
          <MoneyInput valueMinor={draft.feeCents} currency="NGN" onChange={(m) => set("feeCents", m)} />
        </div>
      </div>
      <div className="field">
        <label>Fee / sponsorship terms (your own note — nothing is calculated from this)</label>
        <input className="input" value={draft.feeNote} onChange={(e) => set("feeNote", e.target.value)} placeholder="e.g. Flat ₦50,000 for 30 days, paid by transfer" />
      </div>
      <div className="field" style={css("max-width:220px;")}>
        <label>Status</label>
        <select className="input" value={draft.status} onChange={(e) => set("status", e.target.value)}>
          {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {draft.id && (
        <div style={css("font-size:12px;opacity:0.65;")}>
          {draft.ads} ad(s) · last 30 days: {draft.impressions30d.toLocaleString("en-US")} impressions, {draft.clicks30d.toLocaleString("en-US")} clicks, CTR {ctr(draft.impressions30d, draft.clicks30d)}
        </div>
      )}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add campaign"} onClick={save} disabled={!draft.name.trim() || !draft.advertiserId} />
        {draft.id && draft.status !== "active" && draft.status !== "archived" && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => quick("active")}>Activate</button>}
        {draft.id && draft.status === "active" && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => quick("paused")}>Pause</button>}
        {draft.id && (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => quick(draft.status === "archived" ? "draft" : "archived")}>
            {draft.status === "archived" ? "Restore" : "Archive"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={busy} onClick={remove}>Delete</button>
      </div>
    </div>
  );
}

export default function CampaignsManager({ initial, advertisers }: { initial: CampaignRow[]; advertisers: Advertiser[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map((r) => ({ ...r, key: r.id })));
  return (
    <div style={css("max-width:760px;display:grid;gap:var(--space-4);")}>
      {advertisers.length === 0 && <p style={css("font-size:14px;color:var(--om-coral);margin:0;")}>Add an advertiser first (Advertisers tab) — every campaign belongs to one.</p>}
      {rows.length === 0 && advertisers.length > 0 && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>No campaigns yet.</p>}
      {rows.map((r) => (
        <Row key={r.key} draft={r} advertisers={advertisers} onChange={(d) => setRows((l) => l.map((x) => (x.key === r.key ? d : x)))} onRemoved={() => setRows((l) => l.filter((x) => x.key !== r.key))} />
      ))}
      {advertisers.length > 0 && <div><button type="button" className="btn btn-secondary" onClick={() => setRows((l) => [...l, blank(advertisers[0].id)])}>+ Add a campaign</button></div>}
    </div>
  );
}
