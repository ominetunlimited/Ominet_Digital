import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getPortfolio } from "@/lib/portfolio";
import { LABELS } from "@/lib/portfolio-labels";

export const revalidate = 60;

export async function generateMetadata() {
  const meta = await pageMetadata("Work", "Selected projects from Ominet Digital: publishing, design, video and presentation work, each labelled honestly.", "/work");
  const items = await getPortfolio();
  return items.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function WorkPage() {
  const items = await getPortfolio();
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>WORK</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0 0 var(--space-3);")}>Selected projects</h1>
        <p style={css("font-size:17px;line-height:1.6;opacity:0.8;max-width:60ch;margin:0;")}>Every project carries a label that says plainly whether it was made for a client, as a volunteer, for ourselves or as a simulated concept.</p>
      </section>
      {items.length === 0 ? (
        <section style={css("padding:0 var(--space-6) var(--space-8);")}>
          <p style={css("font-size:18px;opacity:0.8;max-width:56ch;")}>Projects will appear here as they are published.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            <Link href="/services" className="btn btn-secondary">See our services</Link>
            <Link href="/discuss-a-project" className="btn btn-primary">Discuss a project</Link>
          </div>
        </section>
      ) : (
        <section style={css("padding:var(--space-4) var(--space-6) var(--space-8);display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-6);")}>
          {items.map((p) => (
            <Link key={p.id} href={`/work/${p.slug}`} style={css("text-decoration:none;color:inherit;display:block;")}>
              <div style={css("position:relative;aspect-ratio:16/10;border-radius:var(--radius-md);overflow:hidden;background:var(--color-surface, rgba(128,128,128,0.12));")}>
                {p.coverImageUrl && <Image src={p.coverImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 360px" style={{ objectFit: "cover" }} />}
              </div>
              <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.55;margin:var(--space-3) 0 var(--space-1);")}>{(LABELS[p.label]?.name ?? "").toUpperCase()}{p.yearLabel ? ` · ${p.yearLabel}` : ""}</div>
              <h2 style={css("font-family:var(--font-heading);font-size:22px;margin:0 0 var(--space-2);")}>{p.title}</h2>
              {p.summary && <p style={css("font-size:14px;line-height:1.55;opacity:0.75;margin:0;")}>{p.summary}</p>}
            </Link>
          ))}
        </section>
      )}
      <Footer />
    </div>
  );
}
