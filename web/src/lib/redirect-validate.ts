// Redirect manager: path normalization and loop detection. Dependency-free
// (besides the shared destination checker) so it can be unit-tested directly.

import { validateDestination } from "./ad-validate";

export type RedirectEdge = { fromPath: string; toPath: string };

const MAX_HOPS = 25;

function trimTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** The address being redirected FROM: always a path on this site. */
export function normalizeFromPath(raw: string): { ok: true; path: string } | { ok: false; error: string } {
  let p = raw.trim();
  if (!p) return { ok: false, error: "Enter the old address to redirect from." };
  if (p.length > 500) return { ok: false, error: "That address is too long." };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(p)) return { ok: false, error: "The old address must be a path on this site (e.g. /2015/03/my-post.html), not a full URL." };
  if (!p.startsWith("/")) p = `/${p}`;
  if (/[\s#?]/.test(p)) return { ok: false, error: "Use just the page path — no spaces, ? or # (put query strings and fragments aside)." };
  if (p.startsWith("//") || p.startsWith("/\\")) return { ok: false, error: "That doesn't look like a valid page path." };
  if (!/^\/[\w\-./~%]*$/i.test(p)) return { ok: false, error: "That doesn't look like a valid page path." };
  return { ok: true, path: trimTrailingSlash(p) };
}

/** The address being redirected TO: a path on this site, or a full https:// URL. */
export function normalizeToPath(raw: string): { ok: true; path: string } | { ok: false; error: string } {
  const checked = validateDestination(raw);
  if (!checked.ok) return checked;
  return { ok: true, path: checked.url.startsWith("/") ? trimTrailingSlash(checked.url) : checked.url };
}

/**
 * Would saving `from -> to` (alongside every other currently active redirect)
 * create a loop? Walks the chain starting at `to`; if it ever revisits a path
 * already seen — including looping back to `from` itself — that's a loop.
 * An external destination (https://…) always ends the chain immediately.
 */
export function checkRedirectLoop(existing: RedirectEdge[], from: string, to: string): string | null {
  if (from === to) return "A redirect can't point to itself.";
  if (!to.startsWith("/")) return null;

  const byFrom = new Map(existing.map((e) => [e.fromPath, e.toPath]));
  byFrom.set(from, to);

  const visited = new Set([from]);
  let cursor = to;
  for (let i = 0; i < MAX_HOPS; i++) {
    if (visited.has(cursor)) return "This would create a redirect loop — the chain eventually leads back to a page it already passed through.";
    visited.add(cursor);
    const next = byFrom.get(cursor);
    if (!next) return null;
    cursor = next;
  }
  return "This redirect chain is too long (more than 25 hops) — check it for a loop.";
}
