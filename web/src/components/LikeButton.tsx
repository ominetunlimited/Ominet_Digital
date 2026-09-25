"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { toggleLike, type Target } from "@/lib/engagement-actions";
import ReaderSignIn from "@/components/ReaderSignIn";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

export default function LikeButton({
  target,
  initialCount,
  initialLiked,
  signedIn,
  currentPath,
}: {
  target: Target;
  initialCount: number;
  initialLiked: boolean;
  signedIn: boolean;
  currentPath: string;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  async function handleClick() {
    if (!signedIn) {
      setShowSignIn((s) => !s);
      return;
    }
    setBusy(true);
    const result = await toggleLike(target, currentPath);
    setBusy(false);
    if (result.ok) {
      setLiked(Boolean(result.liked));
      setCount((c) => c + (result.liked ? 1 : -1));
    }
  }

  return (
    <div style={css("display:flex;flex-direction:column;gap:var(--space-2);")}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleClick}
        disabled={busy}
        style={liked ? css("color:var(--om-coral);border-color:var(--om-coral);") : undefined}
      >
        <HeartIcon filled={liked} /> {count > 0 ? count : ""} {count === 1 ? "Like" : "Likes"}
      </button>
      {showSignIn && !signedIn && <ReaderSignIn currentPath={currentPath} prompt="Sign in to like this:" />}
    </div>
  );
}
