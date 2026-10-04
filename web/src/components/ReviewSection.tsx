"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { postReview, deleteReview, type Target } from "@/lib/engagement-actions";
import type { Review } from "@/lib/engagement";
import ReaderSignIn from "@/components/ReaderSignIn";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span aria-label={`${value} of 5 stars`} style={css(`color:var(--om-orange);font-size:${size}px;letter-spacing:1px;`)}>
      {"★".repeat(Math.round(value))}
      {"☆".repeat(5 - Math.round(value))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Your rating" style={css("display:flex;gap:4px;margin-bottom:var(--space-2);")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          style={css(`background:none;border:none;cursor:pointer;padding:2px;font-size:24px;line-height:1;color:${n <= value ? "var(--om-orange)" : "var(--color-neutral-300)"};`)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ReviewSection({
  target,
  average,
  count,
  reviews,
  myReview,
  signedIn,
  currentPath,
  requireSignIn = true,
}: {
  target: Target;
  average: number;
  count: number;
  reviews: Review[];
  myReview: Review | null;
  signedIn: boolean;
  currentPath: string;
  requireSignIn?: boolean;
}) {
  const [mine, setMine] = useState(myReview);
  const list = reviews;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const guestAllowed = !requireSignIn;

  async function submit() {
    if (!rating) {
      setError("Pick a star rating first.");
      return;
    }
    if (!signedIn && guestAllowed && !guestName.trim()) {
      setError("Enter a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await postReview(target, rating, body, currentPath, guestAllowed ? guestName : undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMine({ id: `local-${Date.now()}`, rating, body: body.trim() || null, createdAt: new Date().toISOString(), authorName: signedIn ? "You" : guestName.trim() || "Guest", isOwn: true, status: "pending" });
    setNotice(result.message ?? "Posted.");
  }

  async function remove() {
    if (!mine || !confirm("Delete your review?")) return;
    setBusy(true);
    const result = await deleteReview(mine.id, currentPath);
    setBusy(false);
    if (result.ok) {
      setMine(null);
      setRating(0);
      setBody("");
      setNotice(null);
    }
  }

  return (
    <div>
      <div style={css("display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;")}>
        {count > 0 ? (
          <>
            <Stars value={average} size={20} />
            <span style={css("font-size:14px;opacity:0.7;")}>
              {average.toFixed(1)} out of 5 &middot; {count} review{count === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span style={css("font-size:13px;opacity:0.5;")}>No ratings yet — be the first.</span>
        )}
      </div>

      {mine ? (
        <div style={css("margin-bottom:var(--space-4);padding:var(--space-3);border:1px solid var(--color-divider);border-radius:var(--radius-md);")}>
          <div style={css("display:flex;justify-content:space-between;align-items:center;gap:var(--space-2);margin-bottom:4px;")}>
            <Stars value={mine.rating} />
            <button type="button" className="btn btn-ghost" style={css("font-size:12px;color:var(--om-coral);")} onClick={remove} disabled={busy}>
              Delete
            </button>
          </div>
          {mine.body && <p style={css("font-size:14px;margin:4px 0 0;")}>{mine.body}</p>}
          {mine.status === "pending" && <p style={css("font-size:12px;opacity:0.6;margin:var(--space-2) 0 0;")}>Awaiting moderation — only visible to you until approved.</p>}
        </div>
      ) : signedIn || guestAllowed ? (
        <div style={css("margin-bottom:var(--space-4);")}>
          <StarPicker value={rating} onChange={setRating} />
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
            aria-label="Write a review (optional)"
            placeholder="Write a review (optional)…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={css("margin-bottom:var(--space-2);")}
          />
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !rating}>
            {busy ? "Posting…" : "Post review"}
          </button>
          {!signedIn && (
            <div style={css("margin-top:var(--space-2);")}>
              <ReaderSignIn currentPath={currentPath} prompt="Reviewing as a guest. Have an account?" />
            </div>
          )}
          {error && <p style={css("font-size:12px;color:var(--om-coral);margin-top:var(--space-2);")}>{error}</p>}
          {notice && !error && <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-2);")}>{notice}</p>}
        </div>
      ) : (
        <div style={css("margin-bottom:var(--space-4);")}>
          <ReaderSignIn currentPath={currentPath} prompt="Sign in to leave a review:" />
        </div>
      )}

      {list.length === 0 ? (
        <p style={css("font-size:13px;opacity:0.5;")}>No written reviews yet.</p>
      ) : (
        <div>
          {list.map((r) => (
            <div key={r.id} style={css("padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);")}>
              <div style={css("display:flex;justify-content:space-between;gap:var(--space-2);align-items:center;margin-bottom:4px;")}>
                <Stars value={r.rating} />
                <span style={css("font-size:12px;opacity:0.6;")}>{timeAgo(r.createdAt)}</span>
              </div>
              <div style={css("font-size:12px;font-weight:700;opacity:0.7;margin-bottom:2px;")}>{r.authorName}</div>
              {r.body && <p style={css("font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;")}>{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
