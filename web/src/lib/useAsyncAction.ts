"use client";

// Shared by every button that calls a Server Action and either redirects on
// success or returns { ok, error } — admin save/delete forms AND public
// checkout buttons (PaywallGate, product Buy buttons). Originally built for
// the admin "stuck on Saving..." bug; the exact same failure mode showed up
// on the public "Get full access" checkout button ("Redirecting..." for 30
// minutes) for the same reason: a bare `await action()` with no timeout and
// no catch. One hook, one fix, used everywhere this pattern appears.
//
// What it guarantees:
// 1. `busy` always resolves — even on an exception the action didn't
//    anticipate — via try/catch/finally-equivalent handling below.
// 2. The call is raced against a timeout so the UI can never wait forever.
// 3. A genuine Next.js redirect-on-success (which works by *throwing*) still
//    passes through un-caught, so navigation keeps working normally.

import { useRef, useState } from "react";

export type AsyncActionState = "idle" | "busy" | "done" | "error";

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

export function useAsyncAction(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const [state, setState] = useState<AsyncActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  async function run<T extends Result>(fn: () => Promise<T>): Promise<T | undefined> {
    const id = ++runId.current;
    setState("busy");
    setError(null);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("This is taking longer than expected. Check your connection and try again."));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([fn(), timeout]);
      if (timer) clearTimeout(timer);
      if (id !== runId.current) return undefined; // a newer run superseded this one

      if (result && result.ok === false) {
        setState("error");
        setError(result.error ?? "Something went wrong. Try again.");
        return result;
      }
      setState("done");
      return result;
    } catch (err) {
      if (timer) clearTimeout(timer);
      // A successful redirect()-based action resolves by throwing a
      // framework signal — let that propagate so navigation still happens.
      if (isFrameworkRedirect(err)) throw err;
      if (id !== runId.current) return undefined;
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      return undefined;
    }
  }

  return { state, error, run, busy: state === "busy" };
}
