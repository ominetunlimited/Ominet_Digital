import { css } from "@/lib/css";
import AdPlacementRow from "@/components/admin/AdPlacementRow";
import AdvertisingNav from "@/components/admin/AdvertisingNav";
import { loadAdData } from "@/lib/admin/ad-data";
import { ctr } from "@/lib/ad-validate";

export const metadata = { title: "Advertising — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminAdvertisingPage() {
  const data = await loadAdData();
  const legacyOnly = data.missingTables;

  return (
    <div style={css("max-width:760px;")}>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Advertising</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);")}>
        Ads only appear where a placement is switched on. Every ad on the site is labelled (Advertisement, Sponsored, Partner) so it can&apos;t be mistaken for your writing.
      </p>
      <AdvertisingNav active="placements" />

      {data.error && <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load advertising data: {data.error}</p>}
      {legacyOnly && (
        <p style={css("font-size:14px;color:var(--om-coral);")}>
          The advertising tables don&apos;t exist yet. Run 0017_advertising.sql in the Supabase SQL Editor, then reload this page.
        </p>
      )}

      {!data.error && !legacyOnly && (
        <>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-3);margin-bottom:var(--space-6);")}>
            <div className="card"><div style={css("font-size:11px;opacity:0.55;letter-spacing:0.08em;")}>LIVE ADS</div><div style={css("font-size:26px;font-family:var(--font-heading);")}>{data.totals.liveAds}</div></div>
            <div className="card"><div style={css("font-size:11px;opacity:0.55;letter-spacing:0.08em;")}>IMPRESSIONS · 30 DAYS</div><div style={css("font-size:26px;font-family:var(--font-heading);")}>{data.totals.impressions30d.toLocaleString("en-US")}</div></div>
            <div className="card"><div style={css("font-size:11px;opacity:0.55;letter-spacing:0.08em;")}>CLICKS · 30 DAYS</div><div style={css("font-size:26px;font-family:var(--font-heading);")}>{data.totals.clicks30d.toLocaleString("en-US")}</div></div>
            <div className="card"><div style={css("font-size:11px;opacity:0.55;letter-spacing:0.08em;")}>CLICK RATE</div><div style={css("font-size:26px;font-family:var(--font-heading);")}>{ctr(data.totals.impressions30d, data.totals.clicks30d)}</div></div>
          </div>
          <p style={css("font-size:12px;opacity:0.55;margin:0 0 var(--space-5);")}>
            Counts are views and clicks recorded on this site (one per visitor per ad within a short window; obvious bots ignored). No revenue is calculated — the only money figure is the fee you type into a campaign, and AdSense earnings can only be seen in your AdSense account.
          </p>
        </>
      )}

      <h2 style={css("font-family:var(--font-heading);font-size:18px;margin:0 0 var(--space-3);")}>Placements</h2>
      {data.placements.map((p) => (
        <AdPlacementRow key={p.id} placement={p} where={p.where} liveAds={p.liveAds} />
      ))}
    </div>
  );
}
