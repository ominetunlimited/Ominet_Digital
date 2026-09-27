import Link from "next/link";
import { css } from "@/lib/css";
import { getRelatedItems, type LinkableType } from "@/lib/related";
import ReadMoreExcerpt from "@/components/ReadMoreExcerpt";

/** Renders nothing when nothing's been linked — never an empty "Related" heading. */
export default async function RelatedSection({ type, id }: { type: LinkableType; id?: string }) {
  if (!id) return null;
  const items = await getRelatedItems(type, id);
  if (items.length === 0) return null;

  return (
    <>
      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>RELATED</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4);")}>
          {items.map((item) => (
            <Link key={`${item.type}:${item.id}`} href={item.href} style={css("display:block;")}>
              <div className="card">
                <div className="card-kicker">{item.kicker}</div>
                <div className="card-title">{item.title}</div>
                {item.excerpt && <ReadMoreExcerpt text={item.excerpt} className="card-body" />}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="hr" />
    </>
  );
}
