import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/components/PlaceholderImage";

/**
 * Editorial book card. The cover is the hero: tall, lit from the left like a hardback
 * standing on a shelf, with the words kept short and quiet beneath it.
 */
export default function BookCard({ href, title, author = "Omini Nfawa", kind, year, excerpt, coverUrl, formats = [], upcoming, cta = "View book" }: {
  href: string; title: string; author?: string; kind?: string; year?: string; excerpt?: string; coverUrl?: string; formats?: string[]; upcoming?: boolean; cta?: string;
}) {
  const body = (
    <>
      <div className="bk-stage">
        <div className="bk-cover">
          {coverUrl ? <Image src={coverUrl} alt="" fill sizes="(max-width: 700px) 60vw, 240px" style={{ objectFit: "cover" }} /> : <PlaceholderImage kind="book" title={title} portrait />}
          <span className="bk-spine" aria-hidden="true" />
          {upcoming && <span className="bk-ribbon">Coming soon</span>}
        </div>
      </div>
      <div className="bk-body">
        <div className="bk-kicker">{[kind, year].filter(Boolean).join(" · ")}</div>
        <h3 className="bk-title">{title}</h3>
        <div className="bk-author">by {author}</div>
        {excerpt && <p className="bk-desc">{excerpt}</p>}
        {formats.length > 0 && <ul className="bk-formats" aria-label="Available formats">{formats.slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>}
        {!upcoming && <span className="bk-cta" aria-hidden="true">{cta} <span>&rarr;</span></span>}
      </div>
    </>
  );
  return upcoming ? <article className="bk-card">{body}</article> : (
    <article className="bk-card"><Link href={href} className="bk-link" aria-label={`${title} by ${author}: ${cta}`}>{body}</Link></article>
  );
}
