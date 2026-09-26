import { css } from "@/lib/css";
import AdvertisingNav from "@/components/admin/AdvertisingNav";
import AdsManager from "@/components/admin/AdsManager";
import { loadAdData } from "@/lib/admin/ad-data";

export const metadata = { title: "Ads — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminAdsPage() {
  const data = await loadAdData();
  const advertiserName = new Map(data.advertisers.map((a) => [a.id, a.name]));
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Ads</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);max-width:64ch;")}>
        Each ad is one image and/or headline that links somewhere. It shows on the site only while it is published, its campaign is active and inside its dates, and its placement is switched on for direct ads.
      </p>
      <AdvertisingNav active="ads" />
      {data.missingTables ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The advertising tables don&apos;t exist yet. Run 0017_advertising.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : data.error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load ads: {data.error}</p>
      ) : (
        <AdsManager
          initial={data.ads}
          campaigns={data.campaigns.filter((c) => c.status !== "archived").map((c) => ({ id: c.id, name: c.name, advertiserName: advertiserName.get(c.advertiserId) ?? "—" }))}
          placements={data.placements.map((p) => ({ slotKey: p.slot_key, label: p.label, provider: p.provider, where: p.where })).filter((p) => p.where !== "Not placed on any page yet")}
        />
      )}
    </div>
  );
}
