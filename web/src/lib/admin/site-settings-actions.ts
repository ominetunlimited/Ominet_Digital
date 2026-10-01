"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  SECTION_KEYS,
  validateAbout,
  validateComments,
  validateContact,
  validateEcosystem,
  validateFooter,
  validateHomepage,
  validateIdentity,
  validateSeo,
  validateSocial,
  type SectionName,
} from "@/lib/site-settings-validate";

export type SaveResult = { ok: true } | { ok: false; error: string };

const VALIDATORS = {
  identity: validateIdentity,
  contact: validateContact,
  social: validateSocial,
  seo: validateSeo,
  footer: validateFooter,
  homepage: validateHomepage,
  about: validateAbout,
  ecosystem: validateEcosystem,
  comments: validateComments,
} as const;

/**
 * Saves one section of the site settings. Admin-only: checked here with the
 * database's own is_admin() and again by the table's row-level security.
 * Values are validated and cleaned on the server — the browser's copy is never trusted.
 */
export async function saveSiteSettings(section: SectionName, data: unknown): Promise<SaveResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false, error: "Only admins can change site settings." };
  if (!(section in VALIDATORS)) return { ok: false, error: "Unknown settings section." };

  const checked = (VALIDATORS[section] as (v: unknown) => { ok: true; value: unknown } | { ok: false; error: string })(data);
  if (!checked.ok) return checked;

  const { error } = await supabase.from("site_settings").upsert({ key: SECTION_KEYS[section], value: checked.value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  // Name, footer, social links and metadata appear on every page.
  revalidatePath("/", "layout");
  return { ok: true };
}
