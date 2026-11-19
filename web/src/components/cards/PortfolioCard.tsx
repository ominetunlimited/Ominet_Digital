import Image from "next/image";
import PlaceholderImage from "@/components/PlaceholderImage";

const RATIOS = ["4 / 5", "1 / 1", "3 / 4", "5 / 4", "4 / 3", "2 / 3"];

/**
 * Image-led portfolio tile for a masonry layout. Rhythm comes from alternating
 * aspect ratios (by `index`), and the words sit over the work rather than beside it.
 */
export default function PortfolioCard({ index = 0, title, category, caption, imageUrl, alt = "", href }: {
  index?: number; title?: string; category?: string; caption?: string | null; imageUrl?: string | null; alt?: string; href?: string;
}) {
  const inner = (
    <>
      <div className="pf-frame" style={{ aspectRatio: RATIOS[index % RATIOS.length] }}>
        {imageUrl ? <Image src={imageUrl} alt={alt} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw" style={{ objectFit: "cover" }} /> : <PlaceholderImage kind="media" title={title} />}
      </div>
      {(title || caption || category) && (
        <figcaption className="pf-cap">
          {category && <span className="pf-cat">{category}</span>}
          {title && <span className="pf-title">{title}</span>}
          {caption && <span className="pf-text">{caption}</span>}
        </figcaption>
      )}
    </>
  );
  return <figure className="pf-card">{href ? <a href={href} className="pf-link">{inner}</a> : inner}</figure>;
}
