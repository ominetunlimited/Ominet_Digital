"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function recordSocialShare(contentId: string, platform: string, caption: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { error } = await supabase.from("social_posts").insert({
    content_id: contentId,
    platform,
    caption,
    status: "shared",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/social");
  return { ok: true };
}
