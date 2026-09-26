import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";

export type LiveAd = {
  id: string;
  kind: string;
  title: string;
  headline?: string;
  imageUrl?: string;
  imageAlt?: string;
  portrait: boolean;
  destinationUrl: string;
  ctaLabel?: string;
  featured: boolean;
};

export type SlotConfig = { provider: "adsense" | "direct"; adClient: string | null; adSlot: string | null };

/** Where each placement actually appears on the public site (shown in the admin). */
export const PLACEMENT_WHERE: Record<string, string> = {
  home_top: "Top of the homepage",
  home_middle: "Middle of the homepage",
  article_inline: "Inside every article, after the text",
  book_page: "On each book page, below the details",
  media_page: "On the Media page",
};

function anon() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Cookie-less on purpose: ads sit on statically generated pages, and reading
 * cookies would turn all of them into per-request pages. Anonymous access only
 * ever returns what the database's own rules make public (active placements;
 * published ads in a live campaign inside its dates).
 */
export async function getSlot(slotKey: string): Promise<SlotConfig | null> {
  if (!supabaseConfigured) return null;
  try {
    const { data } = await anon().from("ad_placements").select("provider,ad_client,ad_slot").eq("slot_key", slotKey).eq("active", true).maybeSingle();
    if (!data) return null;
    return { provider: data.provider === "adsense" ? "adsense" : "direct", adClient: data.ad_client, adSlot: data.ad_slot };
  } catch {
    return null;
  }
}

/** One live ad for the slot: featured ones first, otherwise a random pick so ads rotate. */
export async function pickAd(slotKey: string): Promise<LiveAd | null> {
  if (!supabaseConfigured) return null;
  try {
    const { data, error } = await anon()
      .from("ads")
      .select("id,kind,title,headline,image_url,image_alt,portrait,destination_url,cta_label,featured")
      .eq("slot_key", slotKey)
      .eq("status", "published");
    if (error || !data || data.length === 0) return null;
    const featured = data.filter((a) => a.featured);
    const pool = featured.length > 0 ? featured : data;
    const row = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      headline: row.headline ?? undefined,
      imageUrl: row.image_url ?? undefined,
      imageAlt: row.image_alt ?? undefined,
      portrait: row.portrait,
      destinationUrl: row.destination_url,
      ctaLabel: row.cta_label ?? undefined,
      featured: row.featured,
    };
  } catch {
    return null;
  }
}
