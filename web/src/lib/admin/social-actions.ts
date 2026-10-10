"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function recordSocialShare(contentId: string, platform: string, caption: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
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
