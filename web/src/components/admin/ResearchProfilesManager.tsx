"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { PLATFORMS, type ResearchProfile, type ResearchPlatform } from "@/lib/research";
import { saveResearchProfile, deleteResearchProfile, reorderResearchProfiles } from "@/lib/admin/research-actions";

type Draft = {
  key: string;
  id?: string;
  platform: ResearchPlatform;
  label: string;
  url: string;
  active: boolean;
  showInFooter: boolean;
  showOnProfile: boolean;
  showOnResearch: boolean;
};

const toDraft = (p: ResearchProfile): Draft => ({ key: p.id, id: p.id, platform: p.platform, label: p.label, url: p.url, active: p.active, showInFooter: p.showInFooter, showOnProfile: p.showOnProfile, showOnResearch: p.showOnResearch });

let counter = 0;
const blank = (): Draft => ({ key: `new-${++counter}`, platform: "google_scholar", label: "Google Scholar", url: "", active: true, showInFooter: true, showOnProfile: true, showOnResearch: true });

function Row({
  draft,
  onChange,
  onRemoved,
  onMove,
  first,
  last,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onRemoved: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const { busy, saved, error, run } = useAdminAction();
  const platform = PLATFORMS.find((p) => p.value === draft.platform)!;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  async function save() {
    const res = await run(() => saveResearchProfile(draft));
    if (res?.ok) onChange({ ...draft, id: res.id, url: res.url });
  }

  async function remove() {
    if (!draft.id) return onRemoved();
    if (!confirm(`Remove the ${draft.label} link? It disappears from the website straight away.`)) return;
    const res = await run(() => deleteResearchProfile(draft.id!));
    if (res?.ok) onRemoved();
  }

  const check = (label: string, k: "active" | "showInFooter" | "showOnProfile" | "showOnResearch") => (
    <label className="radio" style={css("font-size:13px;")}>
      <input type="checkbox" checked={draft[k]} onChange={(e) => set(k, e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
      {label}
    </label>
  );

  return (
    <div className="card" style={css("gap:var(--space-3);")}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Platform</label>
          <select
            className="input"
            value={draft.platform}
            onChange={(e) => {
              const next = e.target.value as ResearchPlatform;
              const wasDefault = PLATFORMS.some((p) => p.label === draft.label) || !draft.label;
              onChange({ ...draft, platform: next, label: wasDefault ? PLATFORMS.find((p) => p.value === next)!.label : draft.label });
            }}
          >
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="field" style={css("flex:1;min-width:160px;")}>
          <label>Label shown on the site</label>
          <input className="input" value={draft.label} onChange={(e) => set("label", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Profile link</label>
        <input className="input" value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder={platform.example} />
      </div>
      <div style={css("display:flex;gap:var(--space-4);flex-wrap:wrap;")}>
        {check("Visible on the website", "active")}
        {check("Footer", "showInFooter")}
        {check("About / Omini Nfawa pages", "showOnProfile")}
        {check("Research articles", "showOnResearch")}
      </div>
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add link"} onClick={save} disabled={!draft.url.trim() || !draft.label.trim()} />
        {draft.id && (
          <>
            <button type="button" className="btn btn-secondary" disabled={busy || first} onClick={() => onMove(-1)} aria-label="Move up">↑</button>
            <button type="button" className="btn btn-secondary" disabled={busy || last} onClick={() => onMove(1)} aria-label="Move down">↓</button>
          </>
        )}
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={busy} onClick={remove}>Remove</button>
      </div>
    </div>
  );
}

export default function ResearchProfilesManager({ initial }: { initial: ResearchProfile[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map(toDraft));
  const { busy, error, run } = useAdminAction();

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const before = rows;
    setRows(next);
    const res = await run(() => reorderResearchProfiles(next.filter((r) => r.id).map((r) => r.id!)));
    if (!res?.ok) setRows(before);
  }

  return (
    <div style={css("max-width:720px;display:grid;gap:var(--space-4);")}>
      {rows.length === 0 && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>No research profile links yet. Add your Google Scholar, ResearchGate, Academia.edu or ORCID profile below.</p>}
      {rows.map((r, i) => (
        <Row
          key={r.key}
          draft={r}
          first={i === 0}
          last={i === rows.length - 1}
          onChange={(d) => setRows((list) => list.map((x) => (x.key === r.key ? d : x)))}
          onRemoved={() => setRows((list) => list.filter((x) => x.key !== r.key))}
          onMove={(dir) => move(i, dir)}
        />
      ))}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setRows((list) => [...list, blank()])}>
          + Add a profile link
        </button>
      </div>
    </div>
  );
}
