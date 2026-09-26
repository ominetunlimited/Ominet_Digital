// Caps a teaser field (book/article excerpt) to a short blurb length, cutting
// at the nearest word boundary. Admin excerpt fields are free text — someone
// can paste a full manuscript in there — and every "teaser" spot (hero cards,
// listing grids, meta descriptions) needs a hard ceiling so one long paste
// can't blow out the whole layout.
export function truncate(text: string, maxLength = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
