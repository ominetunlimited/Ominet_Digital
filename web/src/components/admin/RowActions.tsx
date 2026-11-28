"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ShareBar from "@/components/ShareBar";
import { css } from "@/lib/css";
import { getShareInfo, type ShareInfo, type ShareKind } from "@/lib/admin/share-actions";

/**
 * Per-row actions in the admin lists: an eye that opens the real page in a new tab (drafts open too, with a
 * PREVIEW banner, for signed-in staff only) and, for published items, a Share panel with every platform.
 */
export default function RowActions({
  kind,
  id,
  title,
  previewHref,
  published,
}: {
  kind: ShareKind;
  id: string;
  title: string;
  previewHref: string | null;
  published: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  const openPanel = () => {
    setInfo(null);
    setOpen(true);
    getShareInfo(kind, id)
      .then(setInfo)
      .catch(() => setInfo({ ok: false, error: "Could not load the share details. Try again." }));
  };

  // Focus moves into the panel, Escape closes it, and Tab stays inside while it is open.
  useEffect(() => {
    if (!open) return;
    const root = panel.current;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, info]);

  return (
    <span style={css("display:inline-flex;gap:var(--space-1);align-items:center;")}>
      {previewHref && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener"
          className="btn btn-ghost btn-icon"
          aria-label={`Preview ${title}`}
          title={published ? "Open the live page in a new tab" : "Preview the draft in a new tab"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </a>
      )}
      <button
        ref={opener}
        type="button"
        className="btn btn-ghost"
        style={css("font-size:13px;")}
        disabled={!published}
        title={published ? "Share to WhatsApp, X, Threads, Facebook, LinkedIn, Instagram and TikTok" : "Publish it first to share it"}
        aria-label={`Share ${title}`}
        onClick={openPanel}
      >
        Share
      </button>

      {open && (
        <div
          style={css("position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.45);display:grid;place-items:center;padding:16px;")}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-title-${id}`}
            style={css("background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);box-shadow:0 8px 30px rgba(0,0,0,0.18);width:100%;max-width:560px;max-height:90vh;overflow:auto;padding:var(--space-5);")}
          >
            <h2 id={`share-title-${id}`} style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-3);")}>Share</h2>
            <p style={css("font-size:14px;margin:0 0 var(--space-3);font-weight:600;")}>{title}</p>

            {!info && <p role="status" style={css("font-size:14px;opacity:0.7;")}>Preparing the short link…</p>}
            {info && !info.ok && <p role="alert" style={css("font-size:14px;color:var(--color-error, #b3261e);")}>{info.error}</p>}
            {info && info.ok && (
              <>
                <p style={css("font-size:13px;opacity:0.75;margin:0 0 var(--space-3);word-break:break-all;")}>
                  {info.shortUrl ? <>Short link: <strong>{info.shortUrl}</strong></> : <>Link: <strong>{info.url}</strong> (the short link could not be made, so the full address is used)</>}
                </p>
                <ShareBar url={info.url} shortUrl={info.shortUrl} title={info.title} excerpt={info.excerpt} quiet />
                <p style={css("font-size:12px;opacity:0.65;line-height:1.6;margin:var(--space-3) 0 0;")}>
                  WhatsApp, X and Threads open with the post already written. Facebook and LinkedIn build their own preview from the page. Instagram and TikTok cannot be pre-filled, so those buttons copy a caption for you to paste.
                </p>
              </>
            )}

            <div style={css("display:flex;justify-content:flex-end;margin-top:var(--space-4);")}>
              <button type="button" className="btn btn-secondary" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
