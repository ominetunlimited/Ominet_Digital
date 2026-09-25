/**
 * Normalizes arbitrary text into a URL-safe slug. Used both client-side
 * (so the admin sees the real slug as they type) and — the part that
 * actually matters — server-side in every save action, so whatever the
 * admin types or pastes into the Slug field, what lands in the database
 * is always a working URL. A raw, unsanitized slug (spaces, punctuation,
 * mixed case) silently breaks the public page it's supposed to route to.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}
