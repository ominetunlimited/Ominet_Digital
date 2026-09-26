import { createClient } from "@supabase/supabase-js";
import { PLATFORMS, validateProfileUrl, type ResearchPlatform } from "@/lib/research-validate";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";

export type ResearchProfile = {
  id: string;
  platform: ResearchPlatform;
  label: string;
  url: string;
  displayOrder: number;
  active: boolean;
  showInFooter: boolean;
  showOnProfile: boolean;
  showOnResearch: boolean;
};

export { PLATFORMS, validateProfileUrl };
export type { ResearchPlatform };

type Row = {
  id: string;
  platform: ResearchPlatform;
  label: string;
  url: string;
  display_order: number;
  active: boolean;
  show_in_footer: boolean;
  show_on_profile: boolean;
  show_on_research: boolean;
};

export function mapProfile(r: Row): ResearchProfile {
  return {
    id: r.id,
    platform: r.platform,
    label: r.label,
    url: r.url,
    displayOrder: r.display_order,
    active: r.active,
    showInFooter: r.show_in_footer,
    showOnProfile: r.show_on_profile,
    showOnResearch: r.show_on_research,
  };
}

/**
 * Active links for public pages, optionally only those chosen for one
 * placement. Uses a cookie-less client so pages that show it (the footer is
 * on every page) can stay statically generated. Any failure — including the
 * table not existing yet — quietly yields "no links", never a broken page.
 */
export async function getResearchProfiles(placement?: "footer" | "profile" | "research"): Promise<ResearchProfile[]> {
  if (!supabaseConfigured) return [];
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    let query = supabase.from("research_profiles").select("*").eq("active", true).order("display_order");
    if (placement === "footer") query = query.eq("show_in_footer", true);
    if (placement === "profile") query = query.eq("show_on_profile", true);
    if (placement === "research") query = query.eq("show_on_research", true);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as Row[]).map(mapProfile);
  } catch {
    return [];
  }
}
