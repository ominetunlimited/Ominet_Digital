import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EmbedView from "@/components/EmbedView";
import { css } from "@/lib/css";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getPortfolioItem } from "@/lib/portfolio";
import { LABELS } from "@/lib/portfolio-labels";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPortfolioItem(slug);
  if (!p) return {};
  return pageMetadata(p.seoTitle || p.title, p.seoDescription || p.summary || `${p.title}, a project by Ominet Digital.`, `/work/${p.slug}`);
}

export default async function WorkItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPortfolioItem(slug);
  if (!p) notFound();
  const label = LABELS[p.label];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: p.summary ?? undefined,
    url: `${SITE_URL}/work/${p.slug}`, image: p.coverImageUrl ?? undefined, datePublished: p.publishedAt ?? undefined,
  };
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <article style={css("padding:var(--space-8) var(--space-6);max-width:880px;margin:0 auto;")}>
        <Link href="/work" style={css("font-size:13px;opacity:0.6;")}>Back to Work</Link>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.55;margin:var(--space-4) 0 var(--space-2);")}>{label?.name.toUpperCase()}{p.yearLabel ? ` · ${p.yearLabel}` : ""}</div>
        <h1 style={css("font-family:var(--font-heading);font-size:44px;margin:0 0 var(--space-3);")}>{p.title}</h1>
        {p.summary && <p style={css("font-size:18px;line-height:1.6;opacity:0.85;margin:0 0 var(--space-4);")}>{p.summary}</p>}
        <dl style={css("display:grid;grid-template-columns:auto 1fr;gap:6px var(--space-4);font-size:14px;margin:0 0 var(--space-6);")}>
          {p.clientName && <><dt style={css("opacity:0.55;")}>Client</dt><dd style={css("margin:0;")}>{p.clientName}</dd></>}
          {p.role && <><dt style={css("opacity:0.55;")}>Role</dt><dd style={css("margin:0;")}>{p.role}</dd></>}
          {p.services && <><dt style={css("opacity:0.55;")}>Services</dt><dd style={css("margin:0;")}>{p.services}</dd></>}
          <dt style={css("opacity:0.55;")}>About this project</dt><dd style={css("margin:0;")}>{label?.note}</dd>
        </dl>
        {p.coverImageUrl && (
          <div style={css("position:relative;aspect-ratio:16/9;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-6);")}>
            <Image src={p.coverImageUrl} alt="" fill sizes="(max-width: 900px) 100vw, 880px" style={{ objectFit: "cover" }} priority />
          </div>
        )}
        {p.body && <div className="rich-body" style={css("font-size:17px;line-height:1.7;margin-bottom:var(--space-6);")} dangerouslySetInnerHTML={{ __html: p.body }} />}
        {p.media.map((m) => <EmbedView key={m.id} kind={m.kind} url={m.url} title={m.title} caption={m.caption} />)}
        <div style={css("margin-top:var(--space-8);padding-top:var(--space-6);border-top:1px solid rgba(128,128,128,0.25);")}>
          <p style={css("font-size:17px;margin:0 0 var(--space-3);")}>Have something similar in mind?</p>
          <Link href="/discuss-a-project" className="btn btn-primary">Discuss a project</Link>
        </div>
      </article>
      <Footer />
    </div>
  );
}
