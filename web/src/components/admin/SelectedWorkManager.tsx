"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import type { SelectedWork } from "@/lib/selected-work";
import { saveSelectedWork, deleteSelectedWork, reorderSelectedWork } from "@/lib/admin/selected-work-actions";

type Draft = { key: string; id?: string; label: string; yearLabel: string; active: boolean };

const toDraft = (w: SelectedWork): Draft => ({ key: w.id, id: w.id, label: w.label, yearLabel: w.yearLabel, active: w.active });
let counter = 0;
const blank = (): Draft => ({ key: `new-${++counter}`, label: "", yearLabel: "", active: true });

function Row({ draft, onChange, onRemoved, onMove, first, last }: { draft: Draft; onChange: (d: Draft) => void; onRemoved: () => void; onMove: (dir: -1 | 1) => void; first: boolean; last: boolean }) {
  const { busy, saved, error, run } = useAdminAction();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  async function save() {
    const res = await run(() => saveSelectedWork(draft));
    if (res?.ok) onChange({ ...draft, id: res.id });
  }
  async function remove() {
    if (!draft.id) return onRemoved();
    if (!confirm(`Remove "${draft.label}" from the About page?`)) return;
    const res = await run(() => deleteSelectedWork(draft.id!));
    if (res?.ok) onRemoved();
  }

  return (
    <div className="card" style={css("gap:var(--space-3);")}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:3;min-width:220px;")}>
          <label>What it is</label>
          <input className="input" value={draft.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. A Child's Cry in the Savannah, novel" />
        </div>
        <div className="field" style={css("flex:1;min-width:120px;")}>
          <label>Year / dates</label>
          <input className="input" value={draft.yearLabel} onChange={(e) => set("yearLabel", e.target.value)} placeholder="2026" />
        </div>
      </div>
      <label className="radio" style={css("font-size:13px;")}>
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
        Visible on the About page
      </label>
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add entry"} onClick={save} disabled={!draft.label.trim()} />
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

export default function SelectedWorkManager({ initial }: { initial: SelectedWork[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map(toDraft));
  const { busy, error, run } = useAdminAction();

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const before = rows;
    setRows(next);
    const res = await run(() => reorderSelectedWork(next.filter((r) => r.id).map((r) => r.id!)));
    if (!res?.ok) setRows(before);
  }

  return (
    <div style={css("max-width:720px;display:grid;gap:var(--space-4);")}>
      {rows.length === 0 && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>Nothing listed yet — the &ldquo;Selected work&rdquo; section is hidden on the About page until you add an entry.</p>}
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
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setRows((list) => [...list, blank()])}>+ Add an entry</button>
      </div>
    </div>
  );
}
