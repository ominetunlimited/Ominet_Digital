"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { postComment, deleteComment, toggleCommentReaction, type Target } from "@/lib/engagement-actions";
import type { Comment } from "@/lib/engagement";
import ReaderSignIn from "@/components/ReaderSignIn";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CommentRow({ comment, currentPath }: { comment: Comment; currentPath: string }) {
  const [reacted, setReacted] = useState(comment.reactedByMe);
  const [count, setCount] = useState(comment.reactionCount);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function react() {
    setBusy(true);
    const result = await toggleCommentReaction(comment.id, currentPath);
    setBusy(false);
    if (result.ok) {
      setReacted(Boolean(result.reacted));
      setCount((c) => c + (result.reacted ? 1 : -1));
    }
  }

  async function remove() {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    const result = await deleteComment(comment.id, currentPath);
    setBusy(false);
    if (result.ok) setRemoved(true);
  }

  if (removed) return null;

  const statusLabel =
    comment.status === "pending" ? "Awaiting moderation — only visible to you" :
    comment.status === "rejected" ? "Not approved — only visible to you" :
    comment.status === "hidden" ? "Hidden by moderator — only visible to you" :
    null;

  return (
    <div style={css("padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);")}>
      <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);font-size:12px;opacity:0.6;margin-bottom:var(--space-1);")}>
        <span style={css("font-weight:700;")}>{comment.authorName}</span>
        <span>{timeAgo(comment.createdAt)}</span>
      </div>
      {statusLabel && (
        <div style={css("display:inline-block;font-size:11px;letter-spacing:0.04em;color:var(--om-coral);background:rgba(255,111,97,0.1);border-radius:var(--radius-sm);padding:2px 8px;margin-bottom:var(--space-2);")}>
          {statusLabel}
        </div>
      )}
      <p style={css("font-size:14px;line-height:1.6;margin:0 0 var(--space-2);white-space:pre-wrap;")}>{comment.body}</p>
      <div style={css("display:flex;gap:var(--space-3);align-items:center;")}>
        <button
          type="button"
          className="btn btn-ghost"
          style={css(`font-size:12px;padding:2px 6px;${reacted ? "color:var(--om-coral);" : ""}`)}
          onClick={react}
          disabled={busy}
        >
          &#128077; {count > 0 ? count : ""}
        </button>
        {comment.isOwn && (
          <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:2px 6px;color:var(--om-coral);")} onClick={remove} disabled={busy}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({
  target,
  comments,
  signedIn,
  currentPath,
  requireSignIn = true,
}: {
  target: Target;
  comments: Comment[];
  signedIn: boolean;
  currentPath: string;
  /** Admin -> Site settings -> Comments. When false, a guest can comment with just a name. */
  requireSignIn?: boolean;
}) {
  const [list, setList] = useState(comments);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleCount = list.filter((c) => c.status === "approved").length;
  const guestAllowed = !requireSignIn;

  async function submit() {
    if (!body.trim()) return;
    if (!signedIn && guestAllowed && !guestName.trim()) {
      setError("Enter a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await postComment(target, body, currentPath, guestAllowed ? guestName : undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Optimistic local append — the server has the real row; a full refresh
    // (next navigation) will pick up the authoritative list via revalidatePath.
    setList((l) => [
      { id: `local-${Date.now()}`, body: body.trim(), createdAt: new Date().toISOString(), authorName: signedIn ? "You" : guestName.trim() || "Guest", isOwn: true, reactionCount: 0, reactedByMe: false, status: "pending" },
      ...l,
    ]);
    setNotice(result.message ?? "Posted.");
    setBody("");
  }

  return (
    <div>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>
        {visibleCount} COMMENT{visibleCount === 1 ? "" : "S"}
      </div>

      {signedIn || guestAllowed ? (
        <div style={css("margin-bottom:var(--space-4);")}>
          {!signedIn && (
            <input
              className="input"
              aria-label="Your name"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={css("margin-bottom:var(--space-2);max-width:260px;")}
            />
          )}
          <textarea
            className="input"
            rows={3}
            aria-label="Add a comment"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={css("margin-bottom:var(--space-2);")}
          />
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !body.trim()}>
            {busy ? "Posting…" : "Post comment"}
          </button>
          {!signedIn && (
            <div style={css("margin-top:var(--space-2);")}>
              <ReaderSignIn currentPath={currentPath} prompt="Commenting as a guest. Have an account?" />
            </div>
          )}
          {error && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
          {notice && !error && <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-2);")}>{notice}</p>}
        </div>
      ) : (
        <div style={css("margin-bottom:var(--space-4);")}>
          <ReaderSignIn currentPath={currentPath} prompt="Sign in to comment:" />
        </div>
      )}

      {list.length === 0 ? (
        <p style={css("font-size:13px;opacity:0.5;")}>No comments yet — be the first.</p>
      ) : (
        <div>
          {list.map((c) => (
            <CommentRow key={c.id} comment={c} currentPath={currentPath} />
          ))}
        </div>
      )}
    </div>
  );
}
