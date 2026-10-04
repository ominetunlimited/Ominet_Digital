"use client";

import { setReviewStatus, hardDeleteReview, type ReviewStatus } from "@/lib/admin/review-actions";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import { css } from "@/lib/css";

export type ReviewModerationRow = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  status: ReviewStatus;
  authorName: string;
  targetLabel: string;
  targetHref: string | null;
};

export default function ReviewModerationRow({ row }: { row: ReviewModerationRow }) {
  const { busy, error, run } = useAdminAction();

  async function setStatus(status: ReviewStatus) {
    await run(() => setReviewStatus(row.id, status, row.targetHref ?? undefined));
  }

  async function remove() {
    if (!confirm("Permanently delete this review? This can't be undone.")) return;
    await run(() => hardDeleteReview(row.id, row.targetHref ?? undefined));
  }

  return (
    <tr>
      <td data-label="Review" style={css("max-width:360px;")}>
        <div style={css("font-size:13px;color:var(--om-orange);margin-bottom:2px;")} aria-label={`${row.rating} of 5 stars`}>
          {"★".repeat(row.rating)}
          {"☆".repeat(5 - row.rating)}
        </div>
        {row.body && <div style={css("font-size:13px;line-height:1.5;white-space:pre-wrap;margin-bottom:4px;")}>{row.body}</div>}
        <div style={css("font-size:11px;opacity:0.5;")}>
          {row.authorName} &middot; {new Date(row.createdAt).toLocaleString()}
        </div>
      </td>
      <td data-label="On" style={css("font-size:13px;")}>
        {row.targetHref ? <a href={row.targetHref} target="_blank" rel="noreferrer">{row.targetLabel}</a> : row.targetLabel}
      </td>
      <td data-label="Status" style={css("font-size:12px;text-transform:capitalize;")}>{row.status}</td>
      <td data-label="Actions">
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
