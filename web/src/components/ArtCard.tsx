import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/components/PlaceholderImage";
import type { ArtKind } from "@/lib/card-art";

/**
 * The site's one card. The whole card is a single keyboard-focusable link
 * (the stretched <Link>), so the title is the accessible name and nothing
 * nests a link inside a link.
 */
export default function ArtCard({
  href,
  kicker,
  title,
  description,
  imageUrl,
  kind = "default",
  slug,
  cta = "Explore",
  meta,
  external,
}: {
  href: string;
  kicker?: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  kind?: ArtKind;
  slug?: string;
  cta?: string;
  meta?: string;
  external?: boolean;
}) {
  return (
    <article className="omd-card">
      <div className="omd-card-media">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="(max-width: 700px) 92vw, 340px" style={{ objectFit: "cover" }} />
        ) : (
          <PlaceholderImage kind={kind} slug={slug} title={title} />
        )}
      </div>
      <div className="omd-card-body">
        {kicker && <div className="omd-card-kicker">{kicker}</div>}
        <h3 className="omd-card-title">{title}</h3>
        {description && <p className="omd-card-desc">{description}</p>}
        {meta && <div style={{ fontSize: 12, opacity: 0.55 }}>{meta}</div>}
        <span className="omd-card-cta" aria-hidden="true">{cta} <span>&rarr;</span></span>
      </div>
      <Link href={href} className="omd-card-link" aria-label={`${title}: ${cta}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} />
    </article>
  );
}
