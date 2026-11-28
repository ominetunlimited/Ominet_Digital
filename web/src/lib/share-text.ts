// Builds the text that goes with a shared link: the title, a short excerpt, then "Read more: <link>".
// Pure functions with no browser or server code, so they can be tested on their own.

export type SharePlatform = "x" | "whatsapp" | "threads" | "caption";

const READ_MORE = "Read more: ";
const X_LIMIT = 280;
const X_LINK_COST = 23; // X counts every link as 23 characters, whatever its real length
/** Longest excerpt allowed per platform. X also gets whatever room is left under its 280 limit. */
const EXCERPT_MAX: Record<SharePlatform, number> = { x: 140, whatsapp: 220, threads: 260, caption: 300 };
/** Below this many spare characters an excerpt is not worth adding, so only the title and link are shared. */
const MIN_USEFUL_EXCERPT = 40;

/** Plain text from an excerpt: no HTML tags or markdown marks, one line of spaces. */
export function cleanExcerpt(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts at a word boundary and adds an ellipsis. Text that already fits is returned untouched. */
export function truncateAtWord(text: string, max: number): string {
  if (max <= 0) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.\-–]+$/, "")}…`;
}

/**
 * The share text for one platform.
 * - `withLink: false` leaves the link off, for X, which appends the link itself from its own `url` field.
 * - With no usable excerpt it shares the title and link only.
 */
export function buildShareText(
  platform: SharePlatform,
  { title, excerpt, link }: { title: string; excerpt?: string | null; link: string },
  { withLink = true }: { withLink?: boolean } = {}
): string {
  const lead = platform === "x" ? truncateAtWord(title.trim(), X_LIMIT - X_LINK_COST - READ_MORE.length - 4) : title.trim();
  const clean = cleanExcerpt(excerpt);
  let budget = EXCERPT_MAX[platform];
  if (platform === "x") {
    // 280, minus the link, "Read more: ", the two blank lines before the excerpt, and the title.
    budget = Math.min(budget, X_LIMIT - X_LINK_COST - READ_MORE.length - 4 - lead.length - 2);
  }
  const body = clean && budget >= MIN_USEFUL_EXCERPT ? truncateAtWord(clean, budget) : "";
  const parts = [lead];
  if (body) parts.push(body);
  parts.push(withLink ? `${READ_MORE}${link}` : READ_MORE.trimEnd());
  return parts.join("\n\n");
}
