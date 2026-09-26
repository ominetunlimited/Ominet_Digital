"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { updateAdPlacement } from "@/lib/admin/ad-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";

type Placement = {
  id: string;
  slot_key: string;
  label: string;
  provider: string;
  ad_client: string | null;
  ad_slot: string | null;
  html_snippet: string | null;
  active: boolean;
};

export default function AdPlacementRow({ placement }: { placement: Placement }) {
  const [provider, setProvider] = useState(placement.provider);
  const [adClient, setAdClient] = useState(placement.ad_client ?? "");
  const [adSlot, setAdSlot] = useState(placement.ad_slot ?? "");
  const [snippet, setSnippet] = useState(placement.html_snippet ?? "");
  const [active, setActive] = useState(placement.active);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAdminAction();

  async function save() {
    const result = await run(() => updateAdPlacement(placement.id, { provider, ad_client: adClient, ad_slot: adSlot, html_snippet: snippet, active }));
    if (!result?.ok) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="card" style={css("margin-bottom:var(--space-3);")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-3);flex-wrap:wrap;")}>
        <div>
          <div style={css("font-family:var(--font-heading);font-size:16px;")}>{placement.label}</div>
          <div style={css("font-size:11px;opacity:0.5;")}>{placement.slot_key}</div>
        </div>
        <label className="radio">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
          Active
        </label>
      </div>
      <div style={css("display:flex;gap:var(--space-2);margin-top:var(--space-2);flex-wrap:wrap;")}>
        <select className="input" style={css("flex:1;min-width:120px;")} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="adsense">AdSense</option>
          <option value="direct">Direct / sponsored</option>
        </select>
        {provider === "adsense" ? (
          <>
            <input className="input" style={css("flex:1;min-width:140px;")} placeholder="ad_client (ca-pub-...)" value={adClient} onChange={(e) => setAdClient(e.target.value)} />
            <input className="input" style={css("flex:1;min-width:100px;")} placeholder="ad_slot" value={adSlot} onChange={(e) => setAdSlot(e.target.value)} />
          </>
        ) : (
          <textarea className="input" style={css("flex:1;min-width:200px;")} rows={2} placeholder="HTML snippet" value={snippet} onChange={(e) => setSnippet(e.target.value)} />
        )}
      </div>
      <div style={css("display:flex;align-items:center;gap:var(--space-3);margin-top:var(--space-2);")}>
        <button type="button" className="btn btn-secondary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        {saved && <span style={css("font-size:12px;opacity:0.6;")}>Saved</span>}
        {error && <span style={css("font-size:12px;color:var(--om-coral);")}>{error}</span>}
      </div>
    </div>
  );
}
