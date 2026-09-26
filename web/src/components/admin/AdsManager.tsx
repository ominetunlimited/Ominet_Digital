"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AdCard from "@/components/AdCard";
import { AD_KINDS, AD_STATUSES, ctr } from "@/lib/ad-validate";
import { saveAd, setAdStatus, setAdFeatured, deleteAd } from "@/lib/admin/ad-cms-actions";

export type AdRow = {
  id: string;
  campaignId: string;
  slotKey: string;
  kind: string;
  title: string;
  headline: string;
  imageUrl: string;
  imageAlt: string;
  portrait: boolean;
  destinationUrl: string;
  ctaLabel: string;
  status: string;
  featured: boolean;
  live: boolean;
  liveReason: string;
  impressions: number;
  clicks: number;
  impressions30d: number;
  clicks30d: number;
};
type Campaign = { id: string; name: string; advertiserName: string };
type Placement = { slotKey: string; label: string; provider: string; where: string };
type Draft = Omit<AdRow, "id"> & { key: string; id?: string; stale?: boolean };

let n = 0;
const blank = (campaignId: string, slotKey: string): Draft => ({
  key: `new-${++n}`, campaignId, slotKey, kind: "banner", title: "", headline: "", imageUrl: "", imageAlt: "", portrait: false, destinationUrl: "", ctaLabel: "",
  status: "draft", featured: false, live: false, liveReason: "Save the ad, publish it and activate its campaign to show it.", impressions: 0, clicks: 0, impressions30d: 0, clicks30d: 0,
});

function Row({ draft, campaigns, placements, onChange, onRemoved }: { draft: Draft; campaigns: Campaign[]; placements: Placement[]; onChange: (d: Draft) => void; onRemoved: () => void }) {
  const { busy, saved, error, run } = useAdminAction();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v, stale: true });
  const placement = placements.find((p) => p.slotKey === draft.slotKey);

  async function save() {
    const res = await run(() => saveAd(draft));
    if (res?.ok) onChange({ ...draft, id: res.id, stale: true });
  }
  async function status(next: string) {
    if (!draft.id) return set("status", next);
    const res = await run(() => setAdStatus(draft.id!, next));
    if (res?.ok) onChange({ ...draft, status: next, stale: true });
  }
  async function feature() {
    if (!draft.id) return set("featured", !draft.featured);
    const res = await run(() => setAdFeatured(draft.id!, !draft.featured));
    if (res?.ok) onChange({ ...draft, featured: !draft.featured, stale: true });
  }
  async function remove() {
    if (!draft.id) return onRemoved();
    if (!confirm(`Delete the ad "${draft.title}"? It disappears from the site and its statistics are removed. This can't be undone. (Archive instead to keep the history.)`)) return;
    const res = await run(() => deleteAd(draft.id!));
    if (res?.ok) onRemoved();
  }

  const badge = draft.status === "published" ? "PUBLISHED" : draft.status.toUpperCase();

  return (
    <div className="card" style={css(`gap:var(--space-3);${draft.status === "archived" ? "opacity:0.7;" : ""}`)}>
      <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.6;")}>{badge}{draft.featured ? " · FEATURED" : ""}</div>
        {draft.id && (
          <div style={css(`font-size:12px;${draft.live && !draft.stale ? "color:var(--color-accent);" : "opacity:0.7;"}`)}>
            {draft.stale ? "Saved — reload the page to refresh the live status." : draft.liveReason}
          </div>
        )}
      </div>

      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Ad name (only you see this)</label>
          <input className="input" value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:170px;")}>
          <label>Type</label>
          <select className="input" value={draft.kind} onChange={(e) => set("kind", e.target.value)}>
            {AD_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
      </div>

      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:200px;")}>
          <label>Campaign</label>
          <select className="input" value={draft.campaignId} onChange={(e) => set("campaignId", e.target.value)}>
            <option value="">Choose…</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.advertiserName}</option>)}
          </select>
        </div>
        <div className="field" style={css("flex:1;min-width:200px;")}>
          <label>Where it appears</label>
          <select className="input" value={draft.slotKey} onChange={(e) => set("slotKey", e.target.value)}>
            {placements.map((p) => <option key={p.slotKey} value={p.slotKey}>{p.label} — {p.where}</option>)}
          </select>
        </div>
      </div>
      {placement && placement.provider !== "direct" && (
        <p style={css("font-size:12px;color:var(--om-coral);margin:0;")}>This placement is set to Google AdSense, so direct ads won&apos;t show there. Switch it to &ldquo;Direct ads&rdquo; on the Placements tab.</p>
      )}

      <label className="radio" style={css("font-size:13px;")}>
        <input type="checkbox" checked={draft.portrait} onChange={(e) => set("portrait", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        A5 portrait artwork (for book covers and editorial promotions — shown at 210 × 297 proportions)
      </label>
      <ImageUploadField label={draft.portrait ? "Image — A5 portrait" : "Image — wide banner"} value={draft.imageUrl} onChange={(url) => set("imageUrl", url)} />
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:2;min-width:200px;")}>
          <label>Headline (optional if there&apos;s an image)</label>
          <input className="input" value={draft.headline} onChange={(e) => set("headline", e.target.value)} />
        </div>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Button text</label>
          <input className="input" value={draft.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Learn more" />
        </div>
      </div>
      <div className="field">
        <label>Image description for screen readers</label>
        <input className="input" value={draft.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} />
      </div>
      <div className="field">
        <label>Where it links to</label>
        <input className="input" value={draft.destinationUrl} onChange={(e) => set("destinationUrl", e.target.value)} placeholder="https://… or /books/your-book" />
      </div>

      <div>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>PREVIEW (how visitors will see it)</div>
        <AdCard interactive={false} ad={{ kind: draft.kind, title: draft.title || "Untitled ad", headline: draft.headline || undefined, imageUrl: draft.imageUrl || undefined, imageAlt: draft.imageAlt || undefined, portrait: draft.portrait, destinationUrl: draft.destinationUrl || "https://example.com", ctaLabel: draft.ctaLabel || undefined }} />
      </div>

      {draft.id && (
        <div style={css("font-size:12px;opacity:0.65;")}>
          Last 30 days: {draft.impressions30d.toLocaleString("en-US")} impressions, {draft.clicks30d.toLocaleString("en-US")} clicks, CTR {ctr(draft.impressions30d, draft.clicks30d)} ·
          All time: {draft.impressions.toLocaleString("en-US")} / {draft.clicks.toLocaleString("en-US")}. Counts include every visit that isn&apos;t an obvious bot; they aren&apos;t revenue.
        </div>
      )}

      <div className="field" style={css("max-width:220px;")}>
        <label>Status</label>
        <select className="input" value={draft.status} onChange={(e) => set("status", e.target.value)}>
          {AD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add ad"} onClick={save} disabled={!draft.title.trim() || !draft.campaignId || !draft.destinationUrl.trim()} />
        {draft.id && draft.status !== "published" && draft.status !== "archived" && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => status("published")}>Publish</button>}
        {draft.id && draft.status === "published" && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => status("unpublished")}>Unpublish</button>}
        {draft.id && <button type="button" className="btn btn-secondary" disabled={busy} onClick={feature}>{draft.featured ? "Unfeature" : "Feature"}</button>}
        {draft.id && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => status(draft.status === "archived" ? "draft" : "archived")}>{draft.status === "archived" ? "Restore" : "Archive"}</button>}
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={busy} onClick={remove}>Delete</button>
      </div>
    </div>
  );
}

export default function AdsManager({ initial, campaigns, placements }: { initial: AdRow[]; campaigns: Campaign[]; placements: Placement[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map((r) => ({ ...r, key: r.id })));
  const canAdd = campaigns.length > 0 && placements.length > 0;
  return (
    <div style={css("max-width:760px;display:grid;gap:var(--space-4);")}>
      {campaigns.length === 0 && <p style={css("font-size:14px;color:var(--om-coral);margin:0;")}>Create an advertiser and a campaign first — every ad belongs to a campaign.</p>}
      {rows.length === 0 && canAdd && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>No ads yet.</p>}
      {rows.map((r) => (
        <Row key={r.key} draft={r} campaigns={campaigns} placements={placements} onChange={(d) => setRows((l) => l.map((x) => (x.key === r.key ? d : x)))} onRemoved={() => setRows((l) => l.filter((x) => x.key !== r.key))} />
      ))}
      {canAdd && <div><button type="button" className="btn btn-secondary" onClick={() => setRows((l) => [...l, blank(campaigns[0].id, placements[0].slotKey)])}>+ Add an ad</button></div>}
    </div>
  );
}
