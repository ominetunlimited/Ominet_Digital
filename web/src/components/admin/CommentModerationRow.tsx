"use client";

import { setCommentStatus, hardDeleteComment, type CommentStatus } from "@/lib/admin/comment-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { css } from "@/lib/css";

export type ModerationRow = {
  id: string;
  body: string;
  createdAt: string;
  status: CommentStatus;
  authorName: string;
  targetLabel: string;
  targetHref: string | null;
};

export default function CommentModerationRow({ row }: { row: ModerationRow }) {
  const { busy, error, run } = useAdminAction();

  async function setStatus(status: CommentStatus) {
    await run(() => setCommentStatus(row.id, status, row.targetHref ?? undefined));
  }

  async function remove() {
    if (!confirm("Permanently delete this comment? This can't be undone.")) return;
    await run(() => hardDeleteComment(row.id, row.targetHref ?? undefined));
  }

  return (
    <tr>
      <td style={css("max-width:360px;")}>
        <div style={css("font-size:13px;line-height:1.5;white-space:pre-wrap;margin-bottom:4px;")}>{row.body}</div>
        <div style={css("font-size:11px;opacity:0.5;")}>
          {row.authorName} &middot; {new Date(row.createdAt).toLocaleString()}
        </div>
      </td>
      <td style={css("font-size:13px;")}>
        {row.targetHref ? <a href={row.targetHref} target="_blank" rel="noreferrer">{row.targetLabel}</a> : row.targetLabel}
      </td>
      <td style={css("font-size:12px;text-transform:capitalize;")}>{row.status}</td>
      <td>
        <div style={css("display:flex;gap:6px;flex-wrap:wrap;")}>
          {row.status !== "approved" && (
            <button type="button" className="btn btn-primary" style={css("font-size:11px;padding:3px 8px;")} onClick={() => setStatus("approved")} disabled={busy}>
              Approve
            </button>
          )}
          {row.status !== "rejected" && (
            <button type="button" className="btn btn-secondary" style={css("font-size:11px;padding:3px 8px;")} onClick={() => setStatus("rejected")} disabled={busy}>
              Reject
            </button>
          )}
          {row.status !== "hidden" && (
            <button type="button" className="btn btn-secondary" style={css("font-size:11px;padding:3px 8px;")} onClick={() => setStatus("hidden")} disabled={busy}>
              Hide
            </button>
          )}
          {row.status !== "pending" && (
            <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:3px 8px;")} onClick={() => setStatus("pending")} disabled={busy}>
              Restore to pending
            </button>
          )}
          <button type="button" className="btn btn-ghost" style={css("font-size:11px;padding:3px 8px;color:var(--om-coral);")} onClick={remove} disabled={busy}>
            Delete
          </button>
        </div>
        {error && <div style={css("font-size:11px;color:var(--om-coral);margin-top:4px;")}>{error}</div>}
      </td>
    </tr>
  );
}
