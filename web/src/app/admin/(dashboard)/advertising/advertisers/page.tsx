import { css } from "@/lib/css";
import AdvertisingNav from "@/components/admin/AdvertisingNav";
import AdvertisersManager from "@/components/admin/AdvertisersManager";
import { loadAdData } from "@/lib/admin/ad-data";

export const metadata = { title: "Advertisers — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminAdvertisersPage() {
  const data = await loadAdData();
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Advertisers</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);max-width:64ch;")}>
        The people and companies you run ads for. Their contact details are private to the admin and never appear on the site.
      </p>
      <AdvertisingNav active="advertisers" />
      {data.missingTables ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The advertising tables don&apos;t exist yet. Run 0017_advertising.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : data.error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load advertisers: {data.error}</p>
      ) : (
        <AdvertisersManager initial={data.advertisers} />
      )}
    </div>
  );
}
