"use client";

// Every admin save/delete button was calling its Server Action as a bare
// `await action(values)` with no timeout and no catch. Two things made that
// dangerous:
//
// 1. `saveContent`/`saveBook`/`saveProduct` call `redirect()` on success,
//    which works by *throwing* a framework-internal signal. That's fine
//    when Next.js's own machinery catches it — but nothing here was
//    guaranteed to keep that working if the app ever wrapped the call in
//    its own try/catch without special-casing it.
// 2. If the request just never came back — dropped connection, stalled
//    cold start, flaky network — there was no ceiling on the wait at all.
//    `busy` stayed true forever: the exact "stuck on Saving..." report.
//
// This hook is the one place that: (a) always resets busy state, even on
// an exception the action didn't anticipate, (b) races the call against a
// timeout so the UI can never wait indefinitely, and (c) still lets a
// genuine Next.js redirect-on-success pass through un-caught so navigation
// still happens normally.

import { useRef, useState } from "react";

export type AdminActionState = "idle" | "saving" | "saved" | "error";

const DEFAULT_TIMEOUT_MS = 25_000;

type Result = { ok: boolean; error?: string } | void;

function isFrameworkRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (err as { digest: string }).digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

export function useAdminAction(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const [state, setState] = useState<AdminActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  async function run<T extends Result>(fn: () => Promise<T>): Promise<T | undefined> {
    const id = ++runId.current;
    setState("saving");
    setError(null);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("This is taking longer than expected. Check your connection and try again — your edits are still here."));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([fn(), timeout]);
      if (timer) clearTimeout(timer);
      if (id !== runId.current) return undefined; // a newer run superseded this one

      if (result && result.ok === false) {
        setState("error");
        setError(result.error ?? "Could not save. Try again.");
        return result;
      }
      setState("saved");
      return result;
    } catch (err) {
      if (timer) clearTimeout(timer);
      // A successful save/delete resolves via Next.js's redirect(), which
      // throws by design — let that propagate so navigation still happens.
      if (isFrameworkRedirect(err)) throw err;
      if (id !== runId.current) return undefined;
      setState("error");
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
      return undefined;
    }
  }

  return { state, error, run, busy: state === "saving" };
}
