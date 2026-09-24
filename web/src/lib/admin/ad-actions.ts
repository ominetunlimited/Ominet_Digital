"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateAdPlacement(
  id: string,
  patch: { provider: string; ad_client: string; ad_slot: string; html_snippet: string; active: boolean }
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { error } = await supabase
    .from("ad_placements")
    .update({
      provider: patch.provider,
      ad_client: patch.ad_client || null,
      ad_slot: patch.ad_slot || null,
      html_snippet: patch.html_snippet || null,
      active: patch.active,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertising");
  revalidatePath("/");
  return { ok: true };
}
