"use client";

import { css } from "@/lib/css";

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6 }}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Save → Saving… → Saved ✓. The primary button is already the accent colour,
 * so on success it flips to the outlined style with an accent-coloured tick
 * (a tick on an accent background would disappear).
 */
export default function SaveButton({
  busy,
  saved,
  disabled,
  idleLabel,
  onClick,
}: {
  busy: boolean;
  saved: boolean;
  disabled?: boolean;
  idleLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={saved && !busy ? "btn btn-secondary" : "btn btn-primary"}
      onClick={onClick}
      disabled={busy || disabled}
      aria-live="polite"
      style={saved && !busy ? css("color:var(--color-accent);border-color:var(--color-accent);display:inline-flex;align-items:center;") : undefined}
    >
      {busy ? "Saving…" : saved ? (<><Check />Saved</>) : idleLabel}
    </button>
  );
}
