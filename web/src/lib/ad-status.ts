// Explains, in plain words, whether an ad is on the public site right now and,
// if not, exactly why. Mirrors the database's public-visibility rule
// (published ad + active campaign + active advertiser + inside its dates)
// plus the placement being switched on and set to direct ads.

export type LivenessInput = {
  adStatus: string;
  campaignStatus: string | null;
  campaignStartsOn: string | null;
  campaignEndsOn: string | null;
  advertiserStatus: string | null;
  placementActive: boolean;
  placementProvider: string;
};

export function liveness(i: LivenessInput, today = new Date().toISOString().slice(0, 10)): { live: boolean; reason: string } {
  if (i.adStatus !== "published") return { live: false, reason: `Not showing — the ad is ${i.adStatus}.` };
  if (!i.campaignStatus) return { live: false, reason: "Not showing — its campaign is missing." };
  if (i.campaignStatus !== "active") return { live: false, reason: `Not showing — its campaign is ${i.campaignStatus}.` };
  if (i.advertiserStatus && i.advertiserStatus !== "active") return { live: false, reason: "Not showing — its advertiser is archived." };
  if (i.campaignStartsOn && today < i.campaignStartsOn) return { live: false, reason: `Not showing yet — the campaign starts on ${i.campaignStartsOn}.` };
  if (i.campaignEndsOn && today > i.campaignEndsOn) return { live: false, reason: `Not showing — the campaign ended on ${i.campaignEndsOn}.` };
  if (!i.placementActive) return { live: false, reason: "Not showing — its placement is switched off (Advertising → Placements)." };
  if (i.placementProvider !== "direct") return { live: false, reason: "Not showing — its placement is set to Google AdSense, not direct ads." };
  return { live: true, reason: "Live now." };
}
