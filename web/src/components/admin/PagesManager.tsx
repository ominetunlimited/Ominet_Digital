"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import { saveSiteSettings } from "@/lib/admin/site-settings-actions";
import { SITE_PAGES, isPageOn, type CustomLink, type PagesSettings } from "@/lib/site-pages";

const GROUPS: { id: string; title: string }[] = [
  { id: "main", title: "Main pages" },
  { id: "ecosystem", title: "Ecosystem" },
  { id: "utility", title: "Utilities" },
];

const box = css("display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border:1px solid var(--color-divider);border-radius:var(--radius-md);background:var(--color-surface);");

/** Switch pages on/off and add new top-level tabs. A page that is off disappears from the menu, footer and sitemap and answers 404. */
export default function PagesManager({ initial }: { initial: PagesSettings }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initial.enabled);
  const [custom, setCustom] = useState<CustomLink[]>(initial.custom);
  const { busy, saved, error, run } = useAdminAction();
  const state: PagesSettings = { enabled, custom };

  const toggle = (key: string, on: boolean) => setEnabled({ ...enabled, [key]: on });
  const patch = (i: number, p: Partial<CustomLink>) => setCustom(custom.map((c, j) => (j === i ? { ...c, ...p } : c)));

  return (
    <div style={css("display:grid;gap:var(--space-6);max-width:760px;")}>
      {GROUPS.map((g) => (
        <section key={g.id}>
          <h2 style={css("font-family:var(--font-heading);font-size:18px;margin:0 0 var(--space-3);")}>{g.title}</h2>
          <div style={css("display:grid;gap:var(--space-2);")}>
            {SITE_PAGES.filter((p) => p.group === g.id).map((p) => {
              const on = isPageOn(state, p.key);
              return (
                <label key={p.key} style={box}>
                  <input type="checkbox" role="switch" checked={on} onChange={(e) => toggle(p.key, e.target.checked)} style={{ position: "static", width: 20, height: 20, opacity: 1, accentColor: "var(--om-azure)" }} />
                  <span style={css("flex:1;")}>
                    <span style={css("font-weight:600;")}>{p.label}</span>{" "}
                    <span style={css("font-size:12px;opacity:0.55;")}>{p.path}{p.note ? ` · ${p.note}` : ""}</span>
                  </span>
                  <span style={css(`font-size:12px;font-weight:600;color:${on ? "var(--om-azure)" : "var(--om-coral)"};`)}>{on ? "Live" : "Off"}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      <section>
        <h2 style={css("font-family:var(--font-heading);font-size:18px;margin:0 0 var(--space-2);")}>New tabs</h2>
        <p style={css("font-size:13px;opacity:0.65;margin:0 0 var(--space-3);max-width:60ch;")}>
          Add a tab to the menu and footer for anything you start offering later: a page on this site (for example <code>/podcast</code>) or an outside address that starts with https://.
        </p>
        <div style={css("display:grid;gap:var(--space-2);")}>
          {custom.map((c, i) => (
            <div key={c.id + i} style={{ ...box, flexWrap: "wrap" }}>
              <input type="checkbox" role="switch" aria-label={`Show ${c.label || "tab"}`} checked={c.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} style={{ position: "static", width: 20, height: 20, opacity: 1, accentColor: "var(--om-azure)" }} />
              <input className="input" aria-label="Tab name" placeholder="Tab name" value={c.label} maxLength={30} onChange={(e) => patch(i, { label: e.target.value })} style={{ flex: "1 1 140px" }} />
              <input className="input" aria-label="Page path or https address" placeholder="/podcast or https://…" value={c.href} onChange={(e) => patch(i, { href: e.target.value })} style={{ flex: "2 1 220px" }} />
              <button type="button" className="btn btn-secondary" onClick={() => setCustom(custom.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--space-3)" }}>
          <button type="button" className="btn btn-secondary" disabled={custom.length >= 12} onClick={() => setCustom([...custom, { id: "", label: "", href: "", enabled: true }])}>+ Add a tab</button>
        </div>
      </section>

      <div style={css("display:flex;align-items:center;gap:var(--space-3);")}>
        <SaveButton busy={busy} saved={saved} idleLabel="Save changes" onClick={() => void run(() => saveSiteSettings("pages", state))} />
        {error && <span role="alert" style={css("font-size:13px;color:var(--om-coral);")}>{error}</span>}
      </div>
    </div>
  );
}
