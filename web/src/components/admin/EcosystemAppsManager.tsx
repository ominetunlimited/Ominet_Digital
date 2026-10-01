"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { saveEcosystemApp, removeEcosystemApp, listEcosystemApps, type EcosystemApp } from "@/lib/admin/ecosystem-apps-actions";

const BLANK = { id: undefined as string | undefined, title: "", description: "", url: "", visibility: "private" as "private" | "public" };

export default function EcosystemAppsManager({ initial }: { initial: EcosystemApp[] }) {
  const [apps, setApps] = useState(initial);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setBusy(true);
    const res = await saveEcosystemApp(form);
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    setForm(BLANK);
    setApps(await listEcosystemApps());
    setBusy(false);
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Remove "${title}"? This can't be undone.`)) return;
    const res = await removeEcosystemApp(id);
    if (!res.ok) return setError(res.error);
    setApps((list) => list.filter((a) => a.id !== id));
  }

  return (
    <div style={css("max-width:640px;")}>
      <p style={css("font-size:13px;opacity:0.7;margin:0 0 var(--space-4);")}>
        Apps and sites Ominet Digital runs outside the main site. Public entries can be shown elsewhere on the site later; private ones exist only here.
      </p>

      <div style={css("display:grid;gap:var(--space-3);margin-bottom:var(--space-6);")}>
        {apps.length === 0 && <p style={css("font-size:13px;opacity:0.6;")}>Nothing added yet.</p>}
        {apps.map((a) => (
          <div key={a.id} className="card" style={css("gap:var(--space-2);")}>
            <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;align-items:center;")}>
              <strong>{a.title}</strong>
              <span className={a.visibility === "public" ? "tag tag-accent" : "tag tag-outline"}>{a.visibility === "public" ? "PUBLIC" : "PRIVATE"}</span>
            </div>
            {a.description && <p style={css("font-size:13px;opacity:0.7;margin:0;")}>{a.description}</p>}
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={css("font-size:13px;")}>{a.url}</a>
            <div style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;")}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm({ id: a.id, title: a.title, description: a.description, url: a.url, visibility: a.visibility })}
              >
                Edit
              </button>
              <button type="button" className="btn btn-ghost" style={css("color:var(--om-coral);")} onClick={() => remove(a.id, a.title)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{form.id ? "EDIT APP" : "ADD AN APP"}</div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Name</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>Description (optional)</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="field" style={css("margin-bottom:var(--space-4);")}>
        <label>URL</label>
        <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
      </div>
      <label className="radio" style={css("margin-bottom:var(--space-4);")}>
        <input
          type="checkbox"
          checked={form.visibility === "public"}
          onChange={(e) => setForm({ ...form, visibility: e.target.checked ? "public" : "private" })}
          style={{ position: "static", width: "auto", height: "auto", opacity: 1 }}
        />
        Public
      </label>

      {error && <p style={css("font-size:13px;color:var(--om-coral);margin-bottom:var(--space-3);")}>{error}</p>}

      <div style={css("display:flex;gap:var(--space-2);")}>
        <button type="button" className="btn btn-primary" disabled={busy || !form.title || !form.url} onClick={submit}>
          {busy ? "Saving…" : form.id ? "Save changes" : "Add app"}
        </button>
        {form.id && <button type="button" className="btn btn-ghost" onClick={() => setForm(BLANK)}>Cancel</button>}
      </div>
    </div>
  );
}
