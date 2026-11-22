"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateAnonKey } from "@/lib/anon-key";
import { queueAlert, adminLink } from "@/lib/notify/telegram";
import { getSiteSettings } from "@/lib/site-settings";

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

export async function postComment(target: Target, body: string, path: string, guestName?: string, parentId?: string): Promise<ActionResult & { message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Write something first." };
  if (trimmed.length > 2000) return { ok: false, error: "That's a bit long — keep it under 2000 characters." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row: Record<string, unknown> = { body: trimmed, ...targetColumn(target) };
  if (parentId) {
    // Replies stay one level deep: replying to a reply attaches to the original comment.
    const { data: parent } = await supabase.from("comments").select("id,parent_id").eq("id", parentId).maybeSingle();
    if (!parent) return { ok: false, error: "That comment is no longer available." };
    row.parent_id = parent.parent_id ?? parent.id;
  }
  if (user) {
    row.user_id = user.id;
  } else {
    const { comments } = await getSiteSettings();
    if (comments.requireSignIn) return { ok: false, error: "Sign in first to comment." };
    const name = (guestName ?? "").trim().slice(0, 60);
    if (!name) return { ok: false, error: "Enter a name first." };
    row.anon_key = await getOrCreateAnonKey();
    row.guest_name = name;
  }

  // status defaults to 'pending' — every comment is moderated before it's
  // visible to anyone but its own author (see 0006_comment_moderation.sql).
  const { error } = await supabase.from("comments").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  queueAlert("comment", parentId ? "New reply awaiting moderation" : "New comment awaiting moderation", [`On: ${path}`], { link: adminLink("/admin/comments") });
  return { ok: true, message: "Posted — awaiting moderation before it's visible to others." };
}

export async function postReview(target: Target, rating: number, body: string, path: string, guestName?: string): Promise<ActionResult & { message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const r = Math.round(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return { ok: false, error: "Pick a rating from 1 to 5 stars." };
  const trimmed = body.trim();
  if (trimmed.length > 2000) return { ok: false, error: "That's a bit long — keep it under 2000 characters." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row: Record<string, unknown> = { rating: r, body: trimmed || null, ...targetColumn(target) };
  if (user) {
    row.user_id = user.id;
  } else {
    const { comments } = await getSiteSettings();
    if (comments.requireSignIn) return { ok: false, error: "Sign in first to leave a review." };
    const name = (guestName ?? "").trim().slice(0, 60);
    if (!name) return { ok: false, error: "Enter a name first." };
    row.anon_key = await getOrCreateAnonKey();
    row.guest_name = name;
  }

  const { error } = await supabase.from("reviews").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You've already reviewed this." };
    return { ok: false, error: error.message };
  }
  revalidatePath(path);
  queueAlert("comment", "New review awaiting moderation", [`On: ${path}`, `${r}★`], { link: adminLink("/admin/comments") });
  return { ok: true, message: "Posted — awaiting moderation before it's visible to others." };
}

export async function deleteReview(reviewId: string, path: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
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

/** Thumbs up (1) or down (-1). Pressing the same vote again removes it; pressing the other switches it. */
export async function voteComment(commentId: string, value: 1 | -1, path: string): Promise<ActionResult & { myVote?: 1 | -1 | 0 }> {
  if (value !== 1 && value !== -1) return { ok: false, error: "Invalid vote." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first to vote." };

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id,value")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing && (existing.value ?? 1) === value) {
    const { error } = await supabase.from("comment_reactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(path);
    return { ok: true, myVote: 0 };
  }
  if (existing) {
    const { error } = await supabase.from("comment_reactions").update({ value }).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("comment_reactions").insert({ user_id: user.id, comment_id: commentId, value });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(path);
  return { ok: true, myVote: value };
}
