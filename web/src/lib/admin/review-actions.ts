"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden" | "deleted";
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Approve/reject/hide/restore — a soft, reversible status change. Staff-only per RLS (reviews_staff_update, 0032_reviews.sql) and enforced at the app layer by requireStaff(). */
export async function setReviewStatus(id: string, status: ReviewStatus, publicPath?: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const user = { id: auth.userId };

  const { error } = await supabase
    .from("reviews")
    .update({ status, moderated_at: new Date().toISOString(), moderated_by: user.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: status, review_id: id, admin_id: user.id } });

  revalidatePath("/admin/reviews");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}

/** A real, permanent delete — distinct from status:'deleted' (soft/reversible). */
export async function hardDeleteReview(id: string, publicPath?: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const user = { id: auth.userId };
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: "hard_delete", review_id: id, admin_id: user.id } });

  revalidatePath("/admin/reviews");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}
