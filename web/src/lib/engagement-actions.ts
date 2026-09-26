"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export type Target = { contentId?: string; bookId?: string };
export type ActionResult = { ok: true } | { ok: false; error: string };

function targetColumn(target: Target) {
  return target.contentId ? { content_id: target.contentId } : { book_id: target.bookId };
}

export async function toggleLike(target: Target, path: string): Promise<ActionResult & { liked?: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Liking never requires an account (or even email verification) — a
  // signed-in reader's like is still tied to their profile, but a guest
  // likes anonymously via a cookie-derived key instead.
  const identity = user ? { column: "user_id", value: user.id } : { column: "anon_key", value: await getOrCreateAnonKey() };

  const col = targetColumn(target);
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq(identity.column, identity.value)
    .match(col)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(path);
    return { ok: true, liked: false };
  }

  const { error } = await supabase.from("likes").insert({ [identity.column]: identity.value, ...col });
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true, liked: true };
}

export async function postComment(target: Target, body: string, path: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Write something first." };
  if (trimmed.length > 2000) return { ok: false, error: "That's a bit long — keep it under 2000 characters." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first to comment." };

  const { error } = await supabase.from("comments").insert({ user_id: user.id, body: trimmed, ...targetColumn(target) });
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true };
}

export async function deleteComment(commentId: string, path: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true };
}

export async function toggleCommentReaction(commentId: string, path: string): Promise<ActionResult & { reacted?: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first to react." };

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("comment_reactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(path);
    return { ok: true, reacted: false };
  }

  const { error } = await supabase.from("comment_reactions").insert({ user_id: user.id, comment_id: commentId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true, reacted: true };
}
