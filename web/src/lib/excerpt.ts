/** Shortens card teasers to a clean sentence-sized excerpt, cut on a word boundary. */
export function shortExcerpt(text: string | null | undefined, max = 160): string {
  const t = (text ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.\-]+$/, "")}...`;
}
