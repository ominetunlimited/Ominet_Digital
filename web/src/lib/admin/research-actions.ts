"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, type StaffSupabase } from "@/lib/auth/guard";
import { PLATFORMS, validateProfileUrl, type ResearchPlatform } from "@/lib/research";

export type ResearchInput = {
  id?: string;
  platform: ResearchPlatform;
  label: string;
  url: string;
  active: boolean;
  showInFooter: boolean;
  showOnProfile: boolean;
  showOnResearch: boolean;
};

export type ResearchResult = { ok: true; id: string; url: string } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };

async function staffClient(): Promise<{ ok: true; supabase: StaffSupabase } | { ok: false; error: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  return { ok: true, supabase: auth.supabase };
}

function refreshPublic() {
  revalidatePath("/admin/research-profiles");
  // The footer is on every page, so refresh the whole site's cached output.
  revalidatePath("/", "layout");
}

const friendly = (message: string) =>
  /research_profiles/.test(message) && /(does not exist|schema cache)/i.test(message)
    ? "The research_profiles table doesn't exist yet — run migration 0014_research_profiles.sql in the Supabase SQL Editor."
    : message;

export async function saveResearchProfile(input: ResearchInput): Promise<ResearchResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  if (!PLATFORMS.some((p) => p.value === input.platform)) return { ok: false, error: "Choose a platform." };
  const label = input.label.trim();
  if (!label || label.length > 80) return { ok: false, error: "Give the link a short label (up to 80 characters)." };
  const checked = validateProfileUrl(input.platform, input.url);
  if (!checked.ok) return { ok: false, error: checked.error };

  const row = {
    platform: input.platform,
    label,
    url: checked.url,
    active: input.active,
    show_in_footer: input.showInFooter,
    show_on_profile: input.showOnProfile,
    show_on_research: input.showOnResearch,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("research_profiles").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refreshPublic();
    return { ok: true, id: input.id, url: checked.url };
  }

  const { data: last } = await supabase.from("research_profiles").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("research_profiles")
    .insert({ ...row, display_order: (last?.display_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save the link.") };
  refreshPublic();
  return { ok: true, id: data.id, url: checked.url };
}

export async function deleteResearchProfile(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("research_profiles").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refreshPublic();
  return { ok: true };
}

/** Persist a new order: ids in the order they should appear. */
export async function reorderResearchProfiles(ids: string[]): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  for (let i = 0; i < ids.length; i++) {
    const { error } = await auth.supabase.from("research_profiles").update({ display_order: i }).eq("id", ids[i]);
    if (error) return { ok: false, error: friendly(error.message) };
  }
  refreshPublic();
  return { ok: true };
}
