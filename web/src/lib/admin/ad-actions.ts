"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateAdPlacement(
  id: string,
  patch: { provider: string; ad_client: string; ad_slot: string; active: boolean }
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { ok: false, error: "Not allowed." };
  if (patch.provider !== "adsense" && patch.provider !== "direct") return { ok: false, error: "Choose AdSense or Direct." };
  // AdSense identifiers are simple tokens (ca-pub-123…, 1234567890); refuse anything else.
  if (patch.ad_client && !/^ca-pub-\d{6,20}$/.test(patch.ad_client.trim())) return { ok: false, error: "The AdSense client ID looks like ca-pub-1234567890123456." };
  if (patch.ad_slot && !/^\d{4,20}$/.test(patch.ad_slot.trim())) return { ok: false, error: "The AdSense slot ID is a number, like 1234567890." };

  const { error } = await supabase
    .from("ad_placements")
    .update({
      provider: patch.provider,
      ad_client: patch.ad_client.trim() || null,
      ad_slot: patch.ad_slot.trim() || null,
      active: patch.active,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/advertising", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
