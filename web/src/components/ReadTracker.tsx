"use client";

import { useEffect } from "react";

const WINDOW_MS = 6 * 60 * 60 * 1000; // one count per visitor per item per six hours

/** Counts one read after the page has been open for a few seconds, so quick
 *  bounces and link-preview bots do not inflate the figure. */
export default function ReadTracker({ kind, slug }: { kind: "blog" | "articles" | "books"; slug: string }) {
  useEffect(() => {
    const key = `omd-read:${kind}:${slug}`;
    try {
      const last = Number(localStorage.getItem(key) || 0);
      if (last && Date.now() - last < WINDOW_MS) return;
    } catch {}
    const t = window.setTimeout(() => {
      try { localStorage.setItem(key, String(Date.now())); } catch {}
      try {
        fetch("/api/read", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ kind, slug }) }).catch(() => {});
      } catch {}
    }, 4000);
    return () => window.clearTimeout(t);
  }, [kind, slug]);
  return null;
}
