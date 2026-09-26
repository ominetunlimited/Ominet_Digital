import { createClient } from "@/lib/supabase/server";
import { liveness } from "@/lib/ad-status";
import { PLACEMENT_WHERE } from "@/lib/ads";
import type { AdRow } from "@/components/admin/AdsManager";
import type { CampaignRow } from "@/components/admin/CampaignsManager";
import type { AdvertiserRow } from "@/components/admin/AdvertisersManager";

type Row = Record<string, unknown>;

export type AdData = {
  missingTables: boolean;
  error: string | null;
  placements: { id: string; slot_key: string; label: string; provider: string; ad_client: string | null; ad_slot: string | null; active: boolean; where: string; liveAds: number }[];
  advertisers: AdvertiserRow[];
  campaigns: CampaignRow[];
  ads: AdRow[];
  totals: { liveAds: number; impressions30d: number; clicks30d: number };
};

const s = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => Number(v ?? 0) || 0;

/** Everything the advertising screens need, read through the signed-in admin's own permissions. */
export async function loadAdData(): Promise<AdData> {
  const empty: AdData = { missingTables: false, error: null, placements: [], advertisers: [], campaigns: [], ads: [], totals: { liveAds: 0, impressions30d: 0, clicks30d: 0 } };
  const supabase = await createClient();
  if (!supabase) return { ...empty, error: "Supabase isn't configured yet." };

  const [pl, adv, camp, ads, stats] = await Promise.all([
    supabase.from("ad_placements").select("*").order("slot_key"),
    supabase.from("ad_advertisers").select("*").order("name"),
    supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("ads").select("*").order("created_at", { ascending: false }),
    supabase.from("ad_stats").select("*"),
  ]);

  if (pl.error) return { ...empty, error: pl.error.message };
  const basePlacements = (pl.data ?? []).map((p: Row) => ({
    id: s(p.id),
    slot_key: s(p.slot_key),
    label: s(p.label),
    provider: s(p.provider) === "adsense" ? "adsense" : "direct",
    ad_client: (p.ad_client as string | null) ?? null,
    ad_slot: (p.ad_slot as string | null) ?? null,
    active: Boolean(p.active),
    where: PLACEMENT_WHERE[s(p.slot_key)] ?? "Not placed on any page yet",
    liveAds: 0,
  }));

  const firstError = [adv, camp, ads, stats].find((r) => r.error)?.error;
  if (firstError) {
    const missing = /(ad_advertisers|ad_campaigns|ad_stats|"ads"|relation "ads")/.test(firstError.message) && /(does not exist|schema cache)/i.test(firstError.message);
    return { ...empty, placements: basePlacements, missingTables: missing, error: missing ? null : firstError.message };
  }

  const statBy = new Map<string, Row>((stats.data ?? []).map((r: Row) => [s(r.ad_id), r]));
  const campaignBy = new Map<string, Row>((camp.data ?? []).map((r: Row) => [s(r.id), r]));
  const advertiserBy = new Map<string, Row>((adv.data ?? []).map((r: Row) => [s(r.id), r]));
  const placementBy = new Map<string, Row>((pl.data ?? []).map((r: Row) => [s(r.slot_key), r]));

  const adRows: AdRow[] = (ads.data ?? []).map((a: Row) => {
    const c = campaignBy.get(s(a.campaign_id));
    const adv2 = c ? advertiserBy.get(s(c.advertiser_id)) : undefined;
    const p = placementBy.get(s(a.slot_key));
    const st = statBy.get(s(a.id));
    const l = liveness({
      adStatus: s(a.status),
      campaignStatus: c ? s(c.status) : null,
      campaignStartsOn: c ? (c.starts_on as string | null) : null,
      campaignEndsOn: c ? (c.ends_on as string | null) : null,
      advertiserStatus: adv2 ? s(adv2.status) : null,
      placementActive: Boolean(p?.active),
      placementProvider: s(p?.provider) || "direct",
    });
    return {
      id: s(a.id),
      campaignId: s(a.campaign_id),
      slotKey: s(a.slot_key),
      kind: s(a.kind),
      title: s(a.title),
      headline: s(a.headline),
      imageUrl: s(a.image_url),
      imageAlt: s(a.image_alt),
      portrait: Boolean(a.portrait),
      destinationUrl: s(a.destination_url),
      ctaLabel: s(a.cta_label),
      status: s(a.status),
      featured: Boolean(a.featured),
      live: l.live,
      liveReason: l.reason,
      impressions: num(st?.impressions_total),
      clicks: num(st?.clicks_total),
      impressions30d: num(st?.impressions_30d),
      clicks30d: num(st?.clicks_30d),
    };
  });

  const campaignRows: CampaignRow[] = (camp.data ?? []).map((c: Row) => {
    const mine = adRows.filter((a) => a.campaignId === s(c.id));
    return {
      id: s(c.id),
      advertiserId: s(c.advertiser_id),
      name: s(c.name),
      startsOn: s(c.starts_on),
      endsOn: s(c.ends_on),
      feeCents: c.fee_cents === null || c.fee_cents === undefined ? null : num(c.fee_cents),
      feeNote: s(c.fee_note),
      status: s(c.status),
      ads: mine.length,
      impressions30d: mine.reduce((t, a) => t + a.impressions30d, 0),
      clicks30d: mine.reduce((t, a) => t + a.clicks30d, 0),
    };
  });

  const advertiserRows: AdvertiserRow[] = (adv.data ?? []).map((a: Row) => {
    const mineCamps = campaignRows.filter((c) => c.advertiserId === s(a.id));
    return {
      id: s(a.id),
      name: s(a.name),
      website: s(a.website),
      contactName: s(a.contact_name),
      contactEmail: s(a.contact_email),
      notes: s(a.notes),
      status: s(a.status) === "archived" ? "archived" : "active",
      campaigns: mineCamps.length,
      ads: mineCamps.reduce((t, c) => t + c.ads, 0),
    };
  });

  const placements = basePlacements.map((p) => ({ ...p, liveAds: adRows.filter((a) => a.slotKey === p.slot_key && a.live).length }));

  return {
    missingTables: false,
    error: null,
    placements,
    advertisers: advertiserRows,
    campaigns: campaignRows,
    ads: adRows,
    totals: {
      liveAds: adRows.filter((a) => a.live).length,
      impressions30d: adRows.reduce((t, a) => t + a.impressions30d, 0),
      clicks30d: adRows.reduce((t, a) => t + a.clicks30d, 0),
    },
  };
}
