// Resolves branded SVG artwork for a card. Real uploaded images always win;
// this is what shows when a service, book, article or product has none.

const SERVICE_FILES: Record<string, string> = {
  "writing-ghostwriting": "service-writing-ghostwriting",
  "research-academic-support": "service-research-academic",
  "book-publishing-formatting": "service-book-publishing",
  "graphic-design-brand-identity": "service-graphic-design",
  "video-editing-film-production": "service-video-editing",
  "photography-visual-documentation": "service-photography",
  "presentation-slide-design": "service-presentation-design",
  "book-marketing-author-branding": "service-book-marketing",
  "social-media-carousel-design": "service-social-media-carousel",
  "website-content-digital-communication": "service-website-content",
};

// For services created later: pick the closest illustration from the words in the title.
const KEYWORDS: [RegExp, string][] = [
  [/ghost|writ|copy|edit|script|speech/i, "service-writing-ghostwriting"],
  [/research|academic|thesis|literature/i, "service-research-academic"],
  [/publish|format|kindle|epub|typeset/i, "service-book-publishing"],
  [/brand|logo|graphic|design|identity|cover/i, "service-graphic-design"],
  [/video|film|edit|documentary|motion/i, "service-video-editing"],
  [/photo/i, "service-photography"],
  [/slide|presentation|pitch|deck/i, "service-presentation-design"],
  [/market|author|launch|promo/i, "service-book-marketing"],
  [/social|carousel|instagram|linkedin/i, "service-social-media-carousel"],
  [/web|content|digital|seo/i, "service-website-content"],
];

export type ArtKind = "service" | "book" | "article" | "essay" | "blog" | "media" | "store" | "profile" | "cortexa" | "default";

export function cardArtPath(kind: ArtKind, opts: { slug?: string; title?: string; portrait?: boolean } = {}): string {
  const dir = opts.portrait ? "/art/portrait/" : "/art/";
  if (kind === "service") {
    const file = (opts.slug && SERVICE_FILES[opts.slug]) || KEYWORDS.find(([re]) => re.test(opts.title ?? opts.slug ?? ""))?.[1];
    if (file) return `${dir}${opts.portrait ? "" : "service/"}${file}.svg`;
    return `${dir}${opts.portrait ? "" : "content/"}content-default.svg`;
  }
  return `${dir}${opts.portrait ? "" : "content/"}content-${kind}.svg`;
}

/** Old placeholder labels used around the site -> the artwork kind they stand for. */
export function kindFromLabel(label?: string): ArtKind {
  const l = (label ?? "").toLowerCase();
  if (l.includes("service")) return "service";
  if (l.includes("book")) return "book";
  if (l.includes("product")) return "store";
  if (l.includes("photo")) return "media";
  if (l.includes("essay")) return "essay";
  if (l.includes("hero") || l.includes("article")) return "article";
  return "default";
}
