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

  return (
    <div style={css("padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);")}>
      <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);font-size:12px;opacity:0.6;margin-bottom:var(--space-1);")}>
        <span style={css("font-weight:700;")}>{comment.authorName}</span>
        <span>{timeAgo(comment.createdAt)}</span>
      </div>
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
}: {
  target: Target;
  comments: Comment[];
  signedIn: boolean;
  currentPath: string;
}) {
  const [list, setList] = useState(comments);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const result = await postComment(target, body, currentPath);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Optimistic local append — the server has the real row; a full refresh
    // (next navigation) will pick up the authoritative list via revalidatePath.
    setList((l) => [
      { id: `local-${Date.now()}`, body: body.trim(), createdAt: new Date().toISOString(), authorName: "You", isOwn: true, reactionCount: 0, reactedByMe: false },
      ...l,
    ]);
    setBody("");
  }

  return (
    <div>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>
        {list.length} COMMENT{list.length === 1 ? "" : "S"}
      </div>

      {signedIn ? (
        <div style={css("margin-bottom:var(--space-4);")}>
          <textarea
            className="input"
            rows={3}
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={css("margin-bottom:var(--space-2);")}
          />
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !body.trim()}>
            {busy ? "Posting…" : "Post comment"}
          </button>
          {error && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
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
