"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { updateAdPlacement } from "@/lib/admin/ad-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";

type Placement = {
  id: string;
  slot_key: string;
  label: string;
  provider: string;
  ad_client: string | null;
  ad_slot: string | null;
  active: boolean;
};

export default function AdPlacementRow({ placement, where, liveAds }: { placement: Placement; where: string; liveAds: number }) {
  const [provider, setProvider] = useState(placement.provider === "adsense" ? "adsense" : "direct");
  const [adClient, setAdClient] = useState(placement.ad_client ?? "");
  const [adSlot, setAdSlot] = useState(placement.ad_slot ?? "");
  const [active, setActive] = useState(placement.active);
  const { busy, saved, error, run } = useAdminAction();

  async function save() {
    await run(() => updateAdPlacement(placement.id, { provider, ad_client: adClient, ad_slot: adSlot, active }));
  }

  return (
    <div className="card" style={css("margin-bottom:var(--space-3);")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-3);flex-wrap:wrap;")}>
        <div>
          <div style={css("font-family:var(--font-heading);font-size:16px;")}>{placement.label}</div>
          <div style={css("font-size:12px;opacity:0.6;")}>{where}</div>
        </div>
        <label className="radio">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
          Active
        </label>
      </div>
      <div style={css("display:flex;gap:var(--space-2);margin-top:var(--space-2);flex-wrap:wrap;")}>
        <select className="input" style={css("flex:1;min-width:150px;")} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="direct">Direct ads (from the Ads tab)</option>
          <option value="adsense">Google AdSense</option>
        </select>
        {provider === "adsense" && (
          <>
            <input className="input" style={css("flex:1;min-width:150px;")} placeholder="ca-pub-1234567890123456" value={adClient} onChange={(e) => setAdClient(e.target.value)} />
            <input className="input" style={css("flex:1;min-width:110px;")} placeholder="Ad slot ID" value={adSlot} onChange={(e) => setAdSlot(e.target.value)} />
          </>
        )}
      </div>
      {provider === "direct" && (
        <div style={css("font-size:12px;opacity:0.65;margin-top:var(--space-2);")}>
          {active
            ? liveAds > 0
              ? `${liveAds} ad${liveAds === 1 ? "" : "s"} live here right now.`
              : "Active, but no ad is live here right now — nothing is shown."
            : "Not active — nothing is shown here."}
        </div>
      )}
      <div style={css("display:flex;align-items:center;gap:var(--space-3);margin-top:var(--space-2);")}>
        <SaveButton busy={busy} saved={saved} idleLabel="Save" onClick={save} />
        {error && <span style={css("font-size:12px;color:var(--om-coral);")}>{error}</span>}
      </div>
    </div>
  );
}
