"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { postComment, deleteComment, voteComment, type Target } from "@/lib/engagement-actions";
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

function CommentRow({
  comment, currentPath, signedIn, isReply = false, onReply,
}: {
  comment: Comment; currentPath: string; signedIn: boolean; isReply?: boolean; onReply?: () => void;
}) {
  const [up, setUp] = useState(comment.upCount);
  const [down, setDown] = useState(comment.downCount);
  const [mine, setMine] = useState<1 | -1 | 0>(comment.myVote);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voteNote, setVoteNote] = useState<string | null>(null);

  async function vote(value: 1 | -1) {
    if (!signedIn) { setVoteNote("Sign in to vote."); return; }
    setBusy(true);
    setVoteNote(null);
    const result = await voteComment(comment.id, value, currentPath);
    setBusy(false);
    if (!result.ok) { setVoteNote(result.error); return; }
    const next = result.myVote ?? 0;
    setUp((n) => n - (mine === 1 ? 1 : 0) + (next === 1 ? 1 : 0));
    setDown((n) => n - (mine === -1 ? 1 : 0) + (next === -1 ? 1 : 0));
    setMine(next);
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
    comment.status === "pending" ? "Awaiting moderation. Only visible to you." :
    comment.status === "rejected" ? "Not approved. Only visible to you." :
    comment.status === "hidden" ? "Hidden by moderator. Only visible to you." :
    null;
  const local = comment.id.startsWith("local-");
  const voteStyle = (active: boolean) => css(`font-size:12px;padding:2px 8px;${active ? "color:var(--om-azure);font-weight:700;" : ""}`);

  return (
    <div style={css(`padding:var(--space-3) 0;${isReply ? "" : "border-bottom:1px solid var(--color-divider);"}`)}>
      <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);font-size:12px;opacity:0.6;margin-bottom:var(--space-1);")}>
        <span style={css("font-weight:700;")}>{comment.authorName}</span>
        <span>{timeAgo(comment.createdAt)}</span>
      </div>
      {statusLabel && (
        <div style={css("display:inline-block;font-size:11px;letter-spacing:0.04em;color:var(--om-coral);background:rgba(255,111,97,0.1);border-radius:var(--radius-sm);padding:2px 8px;margin-bottom:var(--space-1);")}>
          {statusLabel}
        </div>
      )}
      <p style={css("font-size:14px;line-height:1.6;margin:0 0 var(--space-2);white-space:pre-wrap;")}>{comment.body}</p>
      <div style={css("display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap;")}>
        {comment.status === "approved" && !local && (
          <>
            <button type="button" className="btn btn-ghost" style={voteStyle(mine === 1)} onClick={() => vote(1)} disabled={busy} aria-pressed={mine === 1} aria-label="Thumbs up">
              &#128077; {up > 0 ? up : ""}
            </button>
            <button type="button" className="btn btn-ghost" style={voteStyle(mine === -1)} onClick={() => vote(-1)} disabled={busy} aria-pressed={mine === -1} aria-label="Thumbs down">
              &#128078; {down > 0 ? down : ""}
            </button>
            {onReply && (
              <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:2px 8px;")} onClick={onReply}>Reply</button>
            )}
          </>
        )}
        {comment.isOwn && !local && (
          <button type="button" className="btn btn-ghost" style={css("font-size:12px;padding:2px 8px;color:var(--om-coral);")} onClick={remove} disabled={busy}>
            Delete
          </button>
        )}
        {voteNote && <span style={css("font-size:12px;opacity:0.65;")}>{voteNote}</span>}
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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const visibleCount = list.filter((c) => c.status === "approved").length;
  const guestAllowed = !requireSignIn;
  const canWrite = signedIn || guestAllowed;

  const top = list.filter((c) => !c.parentId);
  const repliesOf = (id: string) =>
    list.filter((c) => c.parentId === id).sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());

  async function send(text: string, parentId: string | undefined, clear: () => void) {
    if (!text.trim()) return;
    if (!signedIn && guestAllowed && !guestName.trim()) {
      setError("Enter a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await postComment(target, text, currentPath, guestAllowed ? guestName : undefined, parentId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Optimistic local append. The server holds the real row and the next visit shows the authoritative list.
    const parent = parentId ? list.find((c) => c.id === parentId) : undefined;
    setList((l) => [
      {
        id: `local-${Date.now()}`, body: text.trim(), createdAt: new Date().toISOString(),
        authorName: signedIn ? "You" : guestName.trim() || "Guest", isOwn: true,
        reactionCount: 0, reactedByMe: false, upCount: 0, downCount: 0, myVote: 0,
        parentId: parent ? (parent.parentId ?? parent.id) : null, status: "pending",
      },
      ...l,
    ]);
    setNotice(result.message ?? "Posted.");
    clear();
  }

  const nameField = !signedIn && (
    <input
      className="input"
      aria-label="Your name"
      placeholder="Your name"
      value={guestName}
      onChange={(e) => setGuestName(e.target.value)}
      style={css("margin-bottom:var(--space-2);max-width:260px;")}
    />
  );

  return (
    <div>
      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>
        {visibleCount} COMMENT{visibleCount === 1 ? "" : "S"}
      </div>

      {canWrite ? (
        <div style={css("margin-bottom:var(--space-4);")}>
          {replyTo === null && nameField}
          <textarea
            className="input"
            rows={3}
            aria-label="Add a comment"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={css("margin-bottom:var(--space-2);")}
          />
          <button type="button" className="btn btn-primary" onClick={() => send(body, undefined, () => setBody(""))} disabled={busy || !body.trim()}>
            {busy && replyTo === null ? "Posting…" : "Post comment"}
          </button>
          {!signedIn && (
            <div style={css("margin-top:var(--space-2);")}>
              <ReaderSignIn currentPath={currentPath} prompt="Commenting as a guest. Have an account?" />
            </div>
          )}
          {error && replyTo === null && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
          {notice && !error && <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-2);")}>{notice}</p>}
        </div>
      ) : (
        <div style={css("margin-bottom:var(--space-4);")}>
          <ReaderSignIn currentPath={currentPath} prompt="Sign in to comment:" />
        </div>
      )}

      {top.length === 0 ? (
        <p style={css("font-size:13px;opacity:0.5;")}>No comments yet. Be the first.</p>
      ) : (
        <div>
          {top.map((c) => (
            <div key={c.id}>
              <CommentRow comment={c} currentPath={currentPath} signedIn={signedIn} onReply={canWrite ? () => { setReplyTo(c.id); setReplyBody(""); setError(null); } : undefined} />
              {(repliesOf(c.id).length > 0 || replyTo === c.id) && (
                <div style={css("margin-left:var(--space-4);padding-left:var(--space-3);border-left:2px solid var(--color-divider);")}>
                  {repliesOf(c.id).map((r) => (
                    <CommentRow key={r.id} comment={r} currentPath={currentPath} signedIn={signedIn} isReply onReply={canWrite ? () => { setReplyTo(c.id); setReplyBody(`@${r.authorName} `); setError(null); } : undefined} />
                  ))}
                  {replyTo === c.id && (
                    <div style={css("padding:var(--space-2) 0 var(--space-3);")}>
                      {nameField}
                      <textarea
                        className="input"
                        rows={2}
                        autoFocus
                        aria-label={`Reply to ${c.authorName}`}
                        placeholder={`Reply to ${c.authorName}…`}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        style={css("margin-bottom:var(--space-2);")}
                      />
                      <div style={css("display:flex;gap:var(--space-2);")}>
                        <button type="button" className="btn btn-primary" onClick={() => send(replyBody, c.id, () => { setReplyBody(""); setReplyTo(null); })} disabled={busy || !replyBody.trim()}>
                          {busy ? "Posting…" : "Post reply"}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => { setReplyTo(null); setReplyBody(""); }}>Cancel</button>
                      </div>
                      {error && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
