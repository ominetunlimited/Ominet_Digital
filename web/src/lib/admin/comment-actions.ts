"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CommentStatus = "pending" | "approved" | "rejected" | "hidden" | "deleted";
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Approve/reject/hide/restore — a soft, reversible status change. Staff-only
 *  per RLS (comments_staff_update, added in 0006_comment_moderation.sql). */
export async function setCommentStatus(id: string, status: CommentStatus, publicPath?: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("comments")
    .update({ status, moderated_at: new Date().toISOString(), moderated_by: user?.id ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Lightweight moderation-activity trail via the Stage 1 events pipeline —
  // not the full admin audit log (a separate, later stage), just enough to
  // see moderation activity on the Analytics dashboard for now.
  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: status, comment_id: id, admin_id: user?.id ?? null } });

  revalidatePath("/admin/comments");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}

/** A real, permanent delete — distinct from status:'deleted' (soft/reversible).
 *  Used for genuinely abusive content that shouldn't be recoverable. */
export async function hardDeleteComment(id: string, publicPath?: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("analytics_events").insert({ event_type: "moderation", metadata: { action: "hard_delete", comment_id: id, admin_id: user?.id ?? null } });

  revalidatePath("/admin/comments");
  if (publicPath) revalidatePath(publicPath);
  return { ok: true };
}
