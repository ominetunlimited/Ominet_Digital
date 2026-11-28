import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/seo";

// No 0, 1, l, o or i, so a code read aloud or typed from a screenshot is hard to get wrong.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;
/** Only real content pages can be shortened. The database enforces the same rule. */
export const SHORTENABLE_PATH = /^\/(books|articles|blog|services)\/[a-z0-9][a-z0-9-]*$/;

function newCode() {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/**
 * The short address for a content page, created on first use and reused after that.
 * Server only. Returns null (so callers fall back to the full address) if the table
 * or the service key is unavailable, so a share button never breaks the page.
 * Called from page renders for pages that exist, never from a public endpoint.
 */
export async function getShortUrl(path: string): Promise<string | null> {
  if (!SHORTENABLE_PATH.test(path)) return null;
  try {
    const db = createAdminClient();
    if (!db) return null;
    const found = await db.from("short_links").select("code").eq("path", path).maybeSingle();
    if (found.error) return null;
    if (found.data?.code) return `${SITE_URL}/s/${found.data.code}`;
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = newCode();
      const ins = await db.from("short_links").insert({ code, path });
      if (!ins.error) return `${SITE_URL}/s/${code}`;
      // Another request may have created this path at the same moment: reuse its code.
      const again = await db.from("short_links").select("code").eq("path", path).maybeSingle();
      if (again.data?.code) return `${SITE_URL}/s/${again.data.code}`;
    }
  } catch {
    // fall through to the full address
  }
  return null;
}

/** Looks a code up for the /s/<code> redirect. */
export async function resolveShortCode(code: string): Promise<string | null> {
  if (!/^[a-z0-9]{4,12}$/.test(code)) return null;
  try {
    const db = createAdminClient();
    if (!db) return null;
    const { data } = await db.from("short_links").select("path").eq("code", code).maybeSingle();
    return data?.path && SHORTENABLE_PATH.test(data.path) ? data.path : null;
  } catch {
    return null;
  }
}
