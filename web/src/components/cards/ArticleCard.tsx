import Image from "next/image";
import { shortExcerpt } from "@/lib/excerpt";
import Link from "next/link";
import PlaceholderImage from "@/components/PlaceholderImage";
import type { ArtKind } from "@/lib/card-art";

/** Editorial writing card: type leads, artwork supports. `lead` is the magazine opener; `row` is the compact list entry. */
export default function ArticleCard({ href, title, excerpt, category, subcategory, date, readTime, imageUrl, paid, variant = "row", kind = "article", cta = "Read article" }: {
  href: string; title: string; excerpt?: string; category: string; subcategory?: string; date?: string; readTime?: string; imageUrl?: string | null; paid?: boolean;
  variant?: "lead" | "row"; kind?: ArtKind; cta?: string;
}) {
  return (
    <article className={`ar-card ar-${variant}`}>
      <div className="ar-media">
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes={variant === "lead" ? "(max-width: 800px) 92vw, 520px" : "(max-width: 700px) 30vw, 180px"} style={{ objectFit: "cover" }} /> : <PlaceholderImage kind={kind} title={title} />}
      </div>
      <div className="ar-text">
        <div className="ar-meta">
          <span className="ar-cat">{category}{subcategory ? ` · ${subcategory}` : ""}</span>
          {paid !== undefined && <span className={paid ? "ar-flag ar-paid" : "ar-flag"}>{paid ? "Paid" : "Free"}</span>}
        </div>
        <h3 className="ar-title">{title}</h3>
        {excerpt && <p className="ar-excerpt">{shortExcerpt(excerpt)}</p>}
        <div className="ar-foot">
          <span>{[date, readTime].filter(Boolean).join("  ·  ")}</span>
          <span className="ar-cta" aria-hidden="true">{cta} <span>&rarr;</span></span>
        </div>
      </div>
      <Link href={href} className="ar-link" aria-label={`${title}: ${cta}`} />
    </article>
  );
}
