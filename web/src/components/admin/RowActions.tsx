"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ShareBar from "@/components/ShareBar";
import { css } from "@/lib/css";
import { getShareInfo, type ShareInfo } from "@/lib/admin/share-actions";
import { deleteItem, setItemStatus, type RowKind, type RowStatus } from "@/lib/admin/status-actions";

type Dialog = null | "share" | "delete";

/** What each status offers: one main button, plus the rest under "More". Items that can't be scheduled or archived skip those. */
function plan(kind: RowKind, status: string) {
  const canArchive = kind !== "portfolio";
  const canSchedule = kind === "content" || kind === "books";
  const main: { label: string; to: RowStatus; busy: string } | null =
    status === "published" ? { label: "Unpublish", to: "draft", busy: "Unpublishing…" }
    : status === "archived" ? { label: "Restore", to: "draft", busy: "Restoring…" }
    : { label: status === "scheduled" ? "Publish now" : "Publish", to: "published", busy: "Publishing…" };
  const more: { label: string; to: RowStatus; busy: string }[] = [];
  if (status === "scheduled" && canSchedule) more.push({ label: "Move to draft", to: "draft", busy: "Saving…" });
  if (status === "archived") more.push({ label: "Publish", to: "published", busy: "Publishing…" });
  if (canArchive && status !== "archived") more.push({ label: "Archive", to: "archived", busy: "Archiving…" });
  return { main, more };
}

/**
 * Everything you do to one row in the admin lists: preview (with total views), edit, publish or unpublish,
 * share, and under "More" archive, restore and delete. Staff only; every action runs on the server.
 */
export default function RowActions({
  kind,
  id,
  title,
  status,
  previewHref,
  editHref,
  views,
}: {
  kind: RowKind;
  id: string;
  title: string;
  status: string;
  previewHref: string | null;
  editHref: string;
  /** Total page views of the public page, when known. */
  views?: number;
}) {
  const router = useRouter();
  const published = status === "published";
  const shareable = kind !== "portfolio";
  const { main, more } = plan(kind, status);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLSpanElement>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    opener.current?.focus();
  }, [setDialog]);

  async function change(to: RowStatus, busyLabel: string) {
    setMenu(false);
    setError(null);
    setBusy(busyLabel);
    try {
      const res = await setItemStatus(kind, id, to);
      if (!res.ok) setError(res.error);
      else router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    setError(null);
    setBusy("Deleting…");
    try {
      const res = await deleteItem(kind, id);
      if (!res.ok) { setError(res.error); setDialog(null); }
      else { setDialog(null); router.refresh(); }
    } catch {
      setError("Something went wrong. Try again.");
      setDialog(null);
    } finally {
      setBusy(null);
    }
  }

  function openShare(e: React.MouseEvent<HTMLElement>) {
    opener.current = e.currentTarget;
    setInfo(null);
    setDialog("share");
    getShareInfo(kind as "content" | "books" | "services", id)
      .then(setInfo)
      .catch(() => setInfo({ ok: false, error: "Could not load the share details. Try again." }));
  }

  function openDelete(e: React.MouseEvent<HTMLElement>) {
    opener.current = (menuRef.current?.querySelector("button") as HTMLElement | null) ?? e.currentTarget;
    setMenu(false);
    setDialog("delete");
  }

  // Dialogs: focus moves in, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!dialog) return;
    const root = panel.current;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeDialog(); return; }
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
  }, [dialog, closeDialog, info]);

  // The More menu closes on Escape or a click elsewhere.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menu]);

  const viewsText = typeof views === "number" ? views.toLocaleString("en-GB") : null;
  const small = css("font-size:13px;");
  const overlay = css("position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,0.45);display:grid;place-items:center;padding:16px;");
  const box = css("background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);box-shadow:0 8px 30px rgba(0,0,0,0.18);width:100%;max-width:560px;max-height:90vh;overflow:auto;padding:var(--space-5);");

  return (
    <span style={css("display:inline-flex;gap:var(--space-1);align-items:center;flex-wrap:wrap;")}>
      {previewHref && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener"
          className="btn btn-ghost"
          style={css("display:inline-flex;align-items:center;gap:6px;padding:0 8px;min-width:36px;height:36px;text-decoration:none;")}
          aria-label={`Preview ${title}${viewsText ? `, ${viewsText} ${views === 1 ? "view" : "views"}` : ""}`}
          title={`${published ? "Open the live page in a new tab" : "Preview in a new tab (only you can see it until it is published)"}${viewsText ? `. ${viewsText} total ${views === 1 ? "view" : "views"}.` : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {viewsText && <span style={css("font-size:13px;font-variant-numeric:tabular-nums;")}>{viewsText}</span>}
        </a>
      )}

      <Link href={editHref} className="btn btn-ghost" style={small} aria-label={`Edit ${title}`}>Edit</Link>

      {main && (
        <button type="button" className={published ? "btn btn-ghost" : "btn btn-secondary"} style={small} disabled={busy !== null} onClick={() => change(main.to, main.busy)} aria-label={`${main.label} ${title}`}>
          {busy ?? main.label}
        </button>
      )}

      {shareable && (
        <button type="button" className="btn btn-ghost" style={small} disabled={!published} aria-label={`Share ${title}`} title={published ? "Share to WhatsApp, X, Threads, Facebook, LinkedIn, Instagram and TikTok" : "Publish it first to share it"} onClick={openShare}>
          Share
        </button>
      )}

      <span ref={menuRef} style={css("position:relative;display:inline-block;")}>
        <button type="button" className="btn btn-ghost" style={small} aria-haspopup="menu" aria-expanded={menu} aria-label={`More actions for ${title}`} disabled={busy !== null} onClick={() => setMenu((m) => !m)}>
          More ▾
        </button>
        {menu && (
          <div role="menu" style={css("position:absolute;right:0;top:100%;z-index:50;min-width:170px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);box-shadow:0 8px 24px rgba(0,0,0,0.16);padding:4px;display:grid;")}>
            {more.map((m) => (
              <button key={m.label} type="button" role="menuitem" className="btn btn-ghost" style={css("font-size:13px;justify-content:flex-start;text-align:left;")} onClick={() => change(m.to, m.busy)}>{m.label}</button>
            ))}
            <button type="button" role="menuitem" className="btn btn-ghost" style={css("font-size:13px;justify-content:flex-start;text-align:left;color:var(--om-coral);")} onClick={openDelete}>Delete…</button>
          </div>
        )}
      </span>

      {error && <span role="alert" style={css("flex-basis:100%;font-size:12px;color:var(--om-coral);")}>{error}</span>}

      {dialog === "share" && (
        <div style={overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) closeDialog(); }}>
          <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`dlg-${id}`} style={box}>
            <h2 id={`dlg-${id}`} style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-3);")}>Share</h2>
            <p style={css("font-size:14px;margin:0 0 var(--space-3);font-weight:600;")}>{title}</p>
            {!info && <p role="status" style={css("font-size:14px;opacity:0.7;")}>Preparing the short link…</p>}
            {info && !info.ok && <p role="alert" style={css("font-size:14px;color:var(--om-coral);")}>{info.error}</p>}
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
              <button type="button" className="btn btn-secondary" onClick={closeDialog}>Close</button>
            </div>
          </div>
        </div>
      )}

      {dialog === "delete" && (
        <div style={overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) closeDialog(); }}>
          <div ref={panel} role="alertdialog" aria-modal="true" aria-labelledby={`dlg-${id}`} aria-describedby={`dlg-desc-${id}`} style={box}>
            <h2 id={`dlg-${id}`} style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-3);")}>Delete this permanently?</h2>
            <p style={css("font-size:14px;margin:0 0 var(--space-2);font-weight:600;")}>{title}</p>
            <p id={`dlg-desc-${id}`} style={css("font-size:14px;line-height:1.6;margin:0 0 var(--space-3);")}>
              {published ? "This page is live. Deleting it removes it from the site and its address will show a 404 page. " : ""}
              This cannot be undone.{kind !== "portfolio" && status !== "archived" ? " If you only want it off the site for now, archive it instead." : ""}
            </p>
            <div style={css("display:flex;gap:var(--space-2);justify-content:flex-end;flex-wrap:wrap;margin-top:var(--space-4);")}>
              <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={busy !== null}>Cancel</button>
              {kind !== "portfolio" && status !== "archived" && (
                <button type="button" className="btn btn-secondary" disabled={busy !== null} onClick={() => { setDialog(null); change("archived", "Archiving…"); }}>Archive instead</button>
              )}
              <button type="button" className="btn btn-primary" style={css("background:var(--om-coral);border-color:var(--om-coral);")} disabled={busy !== null} onClick={confirmDelete}>{busy ?? "Delete permanently"}</button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
