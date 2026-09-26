import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_SETTINGS, SECTION_KEYS, mergeSettings, type SiteSettings } from "@/lib/site-settings-validate";

export type { SiteSettings } from "@/lib/site-settings-validate";

/**
 * The site's public settings. Cookie-less so statically generated pages stay
 * static; de-duplicated within one render. If the table is empty, missing or
 * unreachable the site simply uses its built-in defaults — settings can never
 * take a page down.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!supabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from("site_settings").select("key,value").in("key", Object.values(SECTION_KEYS));
    if (error || !data) return DEFAULT_SETTINGS;
    return mergeSettings(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
});
