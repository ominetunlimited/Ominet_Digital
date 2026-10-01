import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { readAnonKey } from "@/lib/anon-key";
import type { Target } from "@/lib/engagement-actions";

export type CommentStatus = "pending" | "approved" | "rejected" | "hidden" | "deleted";

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  isOwn: boolean;
  reactionCount: number;
  reactedByMe: boolean;
  status: CommentStatus;
};

export type Engagement = {
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
};

const EMPTY: Engagement = { likeCount: 0, likedByMe: false, comments: [] };

/** profiles.display_name defaults to the reader's email — never show that
 *  raw in a public comment; show just the part before @ instead. */
function displayName(name: string | null | undefined): string {
  if (!name) return "Reader";
  const at = name.indexOf("@");
  return at > 0 ? name.slice(0, at) : name;
}

export async function getEngagement(target: Target): Promise<Engagement> {
  if (!supabaseConfigured) return EMPTY;
  const supabase = await createClient();
  if (!supabase) return EMPTY;

  const col = target.contentId ? "content_id" : "book_id";
  const val = target.contentId ?? target.bookId;
  if (!val) return EMPTY;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const anonKey = user ? undefined : await readAnonKey();

  const [likeCountRes, likedRes, commentsRes] = await Promise.all([
    supabase.from("likes").select("id", { count: "exact", head: true }).eq(col, val),
    user
      ? supabase.from("likes").select("id").eq(col, val).eq("user_id", user.id).maybeSingle()
      : anonKey
        ? supabase.from("likes").select("id").eq(col, val).eq("anon_key", anonKey).maybeSingle()
        : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id,body,created_at,user_id,anon_key,guest_name,status,profiles!comments_user_id_fkey(display_name),comment_reactions(user_id)")
      .eq(col, val)
      // RLS already restricts rows to approved + the viewer's own +
      // staff, but 'deleted' is a soft-moderation state that should never
      // render even to its own author (unlike pending/rejected/hidden,
      // which give the author feedback on their submission).
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
  ]);

  type Row = {
    id: string;
    body: string;
    created_at: string;
    user_id: string | null;
    anon_key: string | null;
    guest_name: string | null;
    status: CommentStatus;
    profiles: { display_name: string | null } | { display_name: string | null }[] | null;
    comment_reactions: { user_id: string }[] | null;
  };

  const comments: Comment[] = ((commentsRes.data ?? []) as unknown as Row[]).map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    const reactions = c.comment_reactions ?? [];
    return {
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      authorName: c.user_id ? displayName(profile?.display_name) : (c.guest_name?.trim() || "Guest"),
      isOwn: user ? user.id === c.user_id : Boolean(anonKey) && c.anon_key === anonKey,
      reactionCount: reactions.length,
      reactedByMe: user ? reactions.some((r) => r.user_id === user.id) : false,
      status: c.status,
    };
  });

  return {
    likeCount: likeCountRes.count ?? 0,
    likedByMe: Boolean(likedRes.data),
    comments,
  };
}
