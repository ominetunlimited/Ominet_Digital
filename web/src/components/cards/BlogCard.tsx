import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/components/PlaceholderImage";

export default function BlogCard({ href, title, excerpt, category, date, readTime, author, imageUrl, imageAlt }: {
  href: string; title: string; excerpt?: string | null; category?: string | null; date?: string; readTime?: string; author?: string; imageUrl?: string | null; imageAlt?: string | null;
}) {
  return (
    <article className="bl-card">
      <div className="bl-card-media">
        {imageUrl ? <Image src={imageUrl} alt={imageAlt ?? ""} fill sizes="(max-width: 700px) 92vw, 360px" style={{ objectFit: "cover" }} loading="lazy" /> : <PlaceholderImage kind="article" title={title} />}
      </div>
      {category && <span className="bl-cat">{category}</span>}
      <h3>{title}</h3>
      {excerpt && <p>{excerpt}</p>}
      <div className="bl-meta">{[author, date, readTime].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</div>
      <Link href={href} className="bl-link" aria-label={`Read: ${title}`} />
    </article>
  );
}
