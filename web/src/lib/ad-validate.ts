// Shared, dependency-free rules for advertising input. The database enforces
// the same constraints; these give the admin a readable message first.

export const AD_KINDS = [
  { value: "banner", label: "Banner advertisement", tag: "ADVERTISEMENT" },
  { value: "sponsored_content", label: "Sponsored content", tag: "SPONSORED CONTENT" },
  { value: "book", label: "Book advertisement", tag: "SPONSORED · BOOK" },
  { value: "partner", label: "Partner placement", tag: "PARTNER" },
] as const;

export type AdKind = (typeof AD_KINDS)[number]["value"];
export const AD_STATUSES = ["draft", "published", "unpublished", "archived"] as const;
export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "archived"] as const;

export function adTag(kind: string): string {
  return AD_KINDS.find((k) => k.value === kind)?.tag ?? "ADVERTISEMENT";
}

/** https://… (a real website) or an on-site path such as /books/my-book. Nothing else. */
export function validateDestination(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter where the ad should link to." };
  if (text.length > 500) return { ok: false, error: "That link is too long." };

  if (text.startsWith("/")) {
    if (text.startsWith("//") || text.startsWith("/\\") || /[\s\u0000-\u001f]/.test(text)) return { ok: false, error: "That doesn't look like a valid page on this site." };
    return { ok: true, url: text };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  if (u.protocol !== "https:") return { ok: false, error: "The link must start with https:// (or be a page on this site, like /books/my-book)." };
  if (u.username || u.password) return { ok: false, error: "The link can't contain a username or password." };
  if (!u.hostname.includes(".")) return { ok: false, error: "That doesn't look like a real website address." };
  return { ok: true, url: u.toString() };
}

/** Optional https image URL (uploads land in our own storage). */
export function validateImageUrl(raw: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: true, url: null };
  try {
    const u = new URL(text);
    if (u.protocol !== "https:") return { ok: false, error: "The image link must start with https://" };
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, error: "The image link doesn't look valid — upload the image instead." };
  }
}

export function isExternal(url: string): boolean {
  return /^https:\/\//i.test(url);
}

export function checkDates(startsOn: string, endsOn: string): string | null {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (startsOn && (!re.test(startsOn) || Number.isNaN(Date.parse(startsOn)))) return "The start date isn't valid.";
  if (endsOn && (!re.test(endsOn) || Number.isNaN(Date.parse(endsOn)))) return "The end date isn't valid.";
  if (startsOn && endsOn && endsOn < startsOn) return "The end date is before the start date.";
  return null;
}

/** Click-through rate as a percentage string, or "—" when nothing has been shown yet. */
export function ctr(impressions: number, clicks: number): string {
  if (!impressions) return "—";
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}
