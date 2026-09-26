import { cookies } from "next/headers";
import { randomUUID } from "crypto";

// A guest-liking identity that is NOT an account: no email, no password, no
// profile — just an opaque token so the same visitor can't double-like the
// same item. Section 7 of the site's public-access model explicitly forbids
// requiring an account (or even email verification) for a simple like.
const COOKIE = "omd_anon";
const MAX_AGE = 60 * 60 * 24 * 400; // ~13 months, mirrors typical analytics cookie lifetimes

/** Read-only: for Server Components (which can't set cookies during render). */
export async function readAnonKey(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE)?.value;
}

/** For Server Actions/Route Handlers: reads the existing key or mints one. */
export async function getOrCreateAnonKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;
  const key = randomUUID();
  store.set(COOKIE, key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE, path: "/" });
  return key;
}
