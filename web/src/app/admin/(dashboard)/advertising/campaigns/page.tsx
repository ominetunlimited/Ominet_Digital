import { css } from "@/lib/css";
import AdvertisingNav from "@/components/admin/AdvertisingNav";
import CampaignsManager from "@/components/admin/CampaignsManager";
import { loadAdData } from "@/lib/admin/ad-data";

export const metadata = { title: "Campaigns — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminCampaignsPage() {
  const data = await loadAdData();
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Campaigns</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);max-width:64ch;")}>
        A campaign is one engagement with an advertiser — its dates, agreed fee and on/off switch. Pausing or ending a campaign takes all of its ads off the site at once.
      </p>
      <AdvertisingNav active="campaigns" />
      {data.missingTables ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The advertising tables don&apos;t exist yet. Run 0017_advertising.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : data.error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load campaigns: {data.error}</p>
      ) : (
        <CampaignsManager initial={data.campaigns} advertisers={data.advertisers.filter((a) => a.status === "active").map((a) => ({ id: a.id, name: a.name }))} />
      )}
    </div>
  );
}
