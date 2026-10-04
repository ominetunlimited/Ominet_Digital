"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden" | "deleted";
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Approve/reject/hide/restore — a soft, reversible status change. Staff-only per RLS (reviews_staff_update, 0032_reviews.sql). */
export async function setReviewStatus(id: string, status: ReviewStatus, publicPath?: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reviews")
    .update({ status, moderated_at: new Date().toISOString(), moderated_by: user?.id ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: status, review_id: id, admin_id: user?.id ?? null } });

  revalidatePath("/admin/reviews");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}

/** A real, permanent delete — distinct from status:'deleted' (soft/reversible). */
export async function hardDeleteReview(id: string, publicPath?: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: "hard_delete", review_id: id, admin_id: user?.id ?? null } });

  revalidatePath("/admin/reviews");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}
