"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { saveRedirect, setRedirectActive, setRedirectArchived, deleteRedirect } from "@/lib/admin/redirect-actions";

export type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  active: boolean;
  archived: boolean;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Draft = Omit<RedirectRow, "id" | "hitCount" | "lastHitAt" | "createdAt" | "updatedAt"> & {
  key: string;
  id?: string;
  hitCount?: number;
  lastHitAt?: string | null;
};

let n = 0;
const blank = (): Draft => ({ key: `new-${++n}`, fromPath: "", toPath: "", statusCode: 301, active: true, archived: false });
const toDraft = (r: RedirectRow): Draft => ({ ...r, key: r.id });

function Row({ draft, onChange, onRemoved }: { draft: Draft; onChange: (d: Draft) => void; onRemoved: () => void }) {
  const { busy, saved, error, run } = useAdminAction();
  const toggle = useAdminAction();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });

  async function save() {
    const res = await run(() => saveRedirect(draft));
    if (res?.ok) onChange({ ...draft, id: res.id });
  }
  async function flipActive() {
    if (!draft.id) return set("active", !draft.active);
    const next = !draft.active;
    const res = await toggle.run(() => setRedirectActive(draft.id!, next));
    if (res?.ok) onChange({ ...draft, active: next });
  }
  async function flipArchived() {
    if (!draft.id) return onRemoved();
    const next = !draft.archived;
    const res = await toggle.run(() => setRedirectArchived(draft.id!, next));
    if (res?.ok) onChange({ ...draft, archived: next });
  }
  async function remove() {
    if (!draft.id) return onRemoved();
    if (!confirm(`Permanently delete the redirect from "${draft.fromPath}"? This can't be undone. (Archive instead to keep its hit history.)`)) return;
    const res = await toggle.run(() => deleteRedirect(draft.id!));
    if (res?.ok) onRemoved();
  }

  return (
    <div className="card" style={css(`gap:var(--space-3);${draft.archived ? "opacity:0.65;" : ""}`)}>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
        <div className="field" style={css("flex:1;min-width:200px;")}>
          <label>Redirect from (the old address)</label>
          <input className="input" value={draft.fromPath} onChange={(e) => set("fromPath", e.target.value)} placeholder="/2015/03/my-old-post.html" />
        </div>
        <div className="field" style={css("flex:1;min-width:200px;")}>
          <label>Redirect to</label>
          <input className="input" value={draft.toPath} onChange={(e) => set("toPath", e.target.value)} placeholder="/writing/my-new-post or https://…" />
        </div>
        <div className="field" style={css("width:150px;flex-shrink:0;")}>
          <label>Type</label>
          <select className="input" value={draft.statusCode} onChange={(e) => set("statusCode", Number(e.target.value))}>
            <option value={301}>301 — Permanent</option>
            <option value={302}>302 — Temporary</option>
          </select>
        </div>
      </div>

      {draft.id && (
        <div style={css("font-size:12px;opacity:0.6;display:flex;gap:var(--space-4);flex-wrap:wrap;")}>
          <span>{draft.hitCount ?? 0} hit{(draft.hitCount ?? 0) === 1 ? "" : "s"}</span>
          <span>{draft.lastHitAt ? `Last used ${new Date(draft.lastHitAt).toLocaleString()}` : "Never used yet"}</span>
        </div>
      )}
      <p style={css("font-size:12px;opacity:0.55;margin:0;")}>Only takes effect for an address that doesn&apos;t already resolve to a real page on this site.</p>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      {toggle.error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{toggle.error}</p>}

      <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
        <SaveButton busy={busy} saved={saved} idleLabel={draft.id ? "Save changes" : "Add redirect"} onClick={save} disabled={!draft.fromPath.trim() || !draft.toPath.trim() || draft.archived} />
        {draft.id && (
          <button type="button" className="btn btn-secondary" disabled={toggle.busy || draft.archived} onClick={flipActive}>
            {draft.active ? "Disable" : "Enable"}
          </button>
        )}
        <button type="button" className="btn btn-secondary" disabled={toggle.busy} onClick={flipArchived}>
          {draft.archived ? "Restore" : "Archive"}
        </button>
        <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} disabled={toggle.busy} onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function RedirectsManager({ initial }: { initial: RedirectRow[] }) {
  const [rows, setRows] = useState<Draft[]>(initial.map(toDraft));
  const active = rows.filter((r) => !r.archived);
  const archived = rows.filter((r) => r.archived);

  return (
    <div style={css("max-width:760px;display:grid;gap:var(--space-4);")}>
      {active.length === 0 && <p style={css("font-size:14px;opacity:0.6;margin:0;")}>No redirects yet. Add one for each old Blogger/WordPress URL you want to send to its new address here.</p>}
      {active.map((r) => (
        <Row key={r.key} draft={r} onChange={(d) => setRows((l) => l.map((x) => (x.key === r.key ? d : x)))} onRemoved={() => setRows((l) => l.filter((x) => x.key !== r.key))} />
      ))}
      <div><button type="button" className="btn btn-secondary" onClick={() => setRows((l) => [...l, blank()])}>+ Add a redirect</button></div>

      {archived.length > 0 && (
        <>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-top:var(--space-4);")}>ARCHIVED</div>
          {archived.map((r) => (
            <Row key={r.key} draft={r} onChange={(d) => setRows((l) => l.map((x) => (x.key === r.key ? d : x)))} onRemoved={() => setRows((l) => l.filter((x) => x.key !== r.key))} />
          ))}
        </>
      )}
    </div>
  );
}
