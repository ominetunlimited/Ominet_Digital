import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { getSiteSettings } from "@/lib/site-settings";
import { isPageOn } from "@/lib/site-pages";

export const generateMetadata = () => pageMetadata(
  "About us",
  "Ominet Digital is a Nigerian company working across publishing, creative production, technology and professional services. Learn what we do, who we serve and how we work.",
  "/about"
);
export const revalidate = 60;

const AREAS = [
  { title: "Publishing and editorial", text: "Books, essays and other written works: writing, ghostwriting, editing, book formatting, publishing and research support." },
  { title: "Creative and media production", text: "Graphic design, branding, photography, video editing, presentations and visual communication." },
  { title: "Digital products and technology", text: "Websites, digital platforms and tools that respond to changing professional and business needs." },
  { title: "Business and professional support", text: "Selected administrative, registration and documentation support for individuals and small businesses." },
];

const WHO = ["Authors and readers", "Businesses and entrepreneurs", "Institutions and organisations", "Professionals and creators"];

const STEPS = [
  { title: "Understand the need", text: "We listen first and ask what the work is for." },
  { title: "Agree the scope", text: "You receive a written scope and a clear quotation before anything starts." },
  { title: "Do the work", text: "We produce the work and keep you informed as it progresses." },
  { title: "Review and deliver", text: "You review it, we refine it, and we hand over the final files." },
];

export default async function AboutPage() {
  const { identity, pages } = await getSiteSettings();
  const on = (k: string) => isPageOn(pages, k);
  const jsonLd = jsonLdGraph([
    getOrganizationSchema(identity.siteName, identity.logoUrl || undefined),
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About Ominet Digital", path: "/about" }]),
  ]);
  const label = css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);");
  const h2 = css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,34px);margin:0 0 var(--space-4);");
  const body = css("font-size:16px;line-height:1.75;opacity:0.85;max-width:64ch;margin:0 0 var(--space-3);");
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:clip;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={label}>ABOUT OMINET DIGITAL</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(34px,5vw,52px);line-height:1.1;margin:0 0 var(--space-4);max-width:18ch;")}>Ideas, creativity and technology, put to work.</h1>
        <p style={css("font-size:18px;line-height:1.7;opacity:0.9;max-width:64ch;margin:0 0 var(--space-3);")}>Ominet Digital is a Nigerian digital company operating across publishing, creative production, technology and professional services. We bring together ideas, people and practical expertise to develop written works, produce creative content, deliver digital solutions and support projects from concept to completion.</p>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={label}>OUR STORY</div>
        <h2 style={h2}>Where the company comes from</h2>
        <p style={body}>Ominet Digital was founded by Nigerian writer, researcher and creative professional Omini Nfawa Eyong. It grew from a commitment to making creativity practical and technology more accessible, and it continues to develop as an independent company with a growing range of creative, editorial and digital work.</p>
        <p style={body}>We believe good work needs more than a good idea. It needs sound judgement, technical competence, attention to detail and the discipline to see things through. Our purpose is simple: to turn ideas into work that informs, communicates, creates value and serves a purpose.</p>
        {on("founder") && <Link href="/founder">Read about the founder &rarr;</Link>}
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={label}>WHAT WE DO</div>
        <h2 style={h2}>Four areas of work</h2>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--space-4);margin-bottom:var(--space-5);")}>
          {AREAS.map((a) => (
            <div key={a.title} style={css("border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:var(--space-4);")}>
              <h3 style={css("font-family:var(--font-heading);font-size:20px;margin:0 0 var(--space-2);")}>{a.title}</h3>
              <p style={css("font-size:15px;line-height:1.65;opacity:0.8;margin:0;")}>{a.text}</p>
            </div>
          ))}
        </div>
        <p style={body}>Ominet Digital is also a home for ideas and public engagement. Our <Link href="/blog">blog</Link> follows developments across technology, sport, business, science, culture and society. Our <Link href="/articles">articles</Link> make room for more substantial research, critical writing and long-form analysis. Our <Link href="/books">books</Link> bring readers closer to the works we publish.</p>
        {on("services") && <Link href="/services">See our services &rarr;</Link>}
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={label}>WHO WE SERVE</div>
        <h2 style={h2}>People with something to make or say</h2>
        <p style={body}>Some come to us with a manuscript. Others need a complete visual identity, a research project, a media production or a digital solution. Whatever the starting point, our approach is to understand the need, define the scope and apply the right combination of skills.</p>
        <ul style={css("margin:0;padding-left:var(--space-5);font-size:16px;line-height:1.9;opacity:0.85;")}>
          {WHO.map((w) => <li key={w}>{w}</li>)}
        </ul>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={label}>HOW WE WORK</div>
        <h2 style={h2}>From first conversation to final delivery</h2>
        <ol style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4);list-style:none;margin:0;padding:0;")}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div style={css("font-size:12px;letter-spacing:0.1em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-1);")}>STEP {i + 1}</div>
              <div style={css("font-family:var(--font-heading);font-size:19px;margin-bottom:var(--space-1);")}>{s.title}</div>
              <p style={css("font-size:15px;line-height:1.65;opacity:0.8;margin:0;")}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <h2 style={h2}>Have an idea or project in mind?</h2>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <Link href="/discuss-a-project" className="btn btn-primary">Discuss a project</Link>
          <Link href="/contact" className="btn btn-secondary">Contact us</Link>
        </div>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
