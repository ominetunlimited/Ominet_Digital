import Link from "next/link";

export type EcoKey = "omini-nfawa" | "profile" | "media" | "cortexa-office";

/** Each entity gets its own emblem and tint. The glyphs are original line drawings, not logos. */
const GLYPH: Record<EcoKey, React.ReactNode> = {
  // a nib / quill point
  "omini-nfawa": (<g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M60 14 82 58 60 104 38 58Z" /><path d="M60 14v52" /><circle cx="60" cy="72" r="5" /><path d="M30 112h60" /></g>),
  // an identity ring built from verified nodes
  profile: (<g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="60" cy="60" r="38" /><circle cx="60" cy="48" r="11" /><path d="M36 92c4-14 14-20 24-20s20 6 24 20" /><circle cx="98" cy="60" r="4" fill="currentColor" /><circle cx="60" cy="22" r="4" fill="currentColor" /></g>),
  // aperture blades
  media: (<g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="60" cy="60" r="44" /><circle cx="60" cy="60" r="16" /><path d="M60 16 76 46M104 60 74 76M60 104 44 74M16 60l30-16M94 28 66 44M26 92l28-16" /></g>),
  // an office grid of nodes
  "cortexa-office": (<g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="20" y="20" width="80" height="80" rx="10" /><path d="M20 60h80M60 20v80" /><circle cx="40" cy="40" r="5" fill="currentColor" /><circle cx="80" cy="80" r="5" fill="currentColor" /><circle cx="80" cy="40" r="3" /><circle cx="40" cy="80" r="3" /></g>),
};

export default function EcosystemCard({ id, index, kicker, title, description, href, cta }: {
  id: EcoKey; index: number; kicker: string; title: string; description: string; href: string; cta: string;
}) {
  return (
    <article className={`eco-card eco-${id}`}>
      <svg className="eco-glyph" viewBox="0 0 120 120" aria-hidden="true" focusable="false">{GLYPH[id]}</svg>
      <div className="eco-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
      <div className="eco-text">
        <div className="eco-kicker">{kicker}</div>
        <h3 className="eco-title">{title}</h3>
        <p className="eco-desc">{description}</p>
        <span className="eco-cta" aria-hidden="true">{cta} <span>&rarr;</span></span>
      </div>
      <Link href={href} className="eco-link" aria-label={`${title}: ${cta}`} />
    </article>
  );
}
