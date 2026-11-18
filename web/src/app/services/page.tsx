import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ArtCard from "@/components/ArtCard";
import EmptyState from "@/components/EmptyState";
import { css } from "@/lib/css";
import { getServices } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { formatMoney } from "@/lib/money";
import { getSiteSettings } from "@/lib/site-settings";

export const generateMetadata = () => pageMetadata(
  "Ominet Digital Services | Writing, Research, Publishing, Design & Media",
  "Explore professional ghostwriting, editing, research assistance, book publishing, Amazon KDP formatting, graphic design, video editing, photography, presentation design and digital marketing services from Ominet Digital.",
  "/services"
);
export const revalidate = 60;


const WHY: [string, string][] = [
  ["Integrated creative and editorial expertise", "Writing, editing, research, design and multimedia are treated as connected parts of a project, not isolated tasks."],
  ["A strong understanding of books and publishing", "Manuscript development, editorial preparation, book interiors, digital formats, print specifications, publishing metadata and promotional material."],
  ["Research with care and integrity", "Accurate attribution, credible sources and honest representation of evidence."],
  ["Creative work with a clear purpose", "We consider the audience, message, platform and intended response before deciding how a project should look or sound."],
  ["Technical preparation as well as creative thinking", "A publication needs correct files. A video needs clean sound. A presentation needs structure and readability."],
  ["Flexible project engagement", "Commission a single service or combine several. Scope, deliverables, timelines and fees are agreed before work begins."],
  ["Direct, professional communication", "We clarify the brief, confirm expectations, communicate progress and provide agreed review opportunities."],
];

const FAQS: [string, string][] = [
  ["What services does Ominet Digital offer?", "Ominet Digital provides writing and ghostwriting, editing, research and academic support, book publishing and formatting, graphic design, video editing, photography, presentation design, author branding, social media design and website content services."],
  ["Can I combine several services in one project?", "Yes. Services can be commissioned individually or combined. For example, an author may request manuscript editing, book formatting, cover design and promotional materials as one coordinated project."],
  ["Do you work with clients outside Nigeria?", "Yes. Remote projects can be handled for clients in Nigeria and internationally. Any location-specific or in-person requirement will be discussed before a project is accepted."],
  ["How do you determine your fees?", "Fees depend on the scope, length, complexity, source materials, deliverables, formats and turnaround time. Contact us with your brief for a project-specific quotation."],
  ["How do I request a service?", "Open the relevant service page, or use the Discuss a Project form. You can also contact us directly through WhatsApp on +234 902 605 7899 or by email at info@ominetdigital.com.ng."],
  ["Can you work with an existing manuscript, design or video?", "Yes. Share the available files and explain what needs to be improved, completed, converted or produced. We will review the materials before confirming the scope."],
];

function priceLabel(service: { pricingMode: string; priceCents: number | null; currency: string }) {
  if (service.pricingMode === "quote" || service.priceCents == null) return "Quote on request";
  const amount = formatMoney(service.priceCents, service.currency);
  return service.pricingMode === "hourly" ? `${amount} / hour` : amount;
}

export default async function ServicesPage() {
  const [services, { contact }] = await Promise.all([getServices(), getSiteSettings()]);
  const ordered = [...services.filter((s) => s.featured), ...services.filter((s) => !s.featured)];
  const wa = (contact.whatsapp || "").replace(/\D/g, "");
  const waLink = (text: string) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : "/contact");

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);max-width:1100px;")}>
        <div style={css("font-size:11px;letter-spacing:0.12em;color:var(--om-azure);font-weight:600;margin-bottom:var(--space-3);")}>CREATIVE SOLUTIONS. PROFESSIONAL EXCELLENCE.</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(34px,5vw,56px);line-height:1.08;margin:0;")}>Ideas Deserve More Than Attention. They Deserve Excellent Execution.</h1>
        <p style={css("font-size:17px;line-height:1.7;opacity:0.75;max-width:64ch;margin:var(--space-4) 0 var(--space-5);")}>
          Ominet Digital brings writing, research, publishing, design and multimedia production together under one creative roof. We help individuals, authors, businesses and organisations turn ideas into carefully developed written works, professional publications and compelling visual experiences.
        </p>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.7;max-width:64ch;margin:0 0 var(--space-5);")}>
          From the first manuscript draft to a publication-ready book, from research development to a clear presentation, and from a raw video to a finished production, we help move projects from concept to completion.
        </p>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <a href="#service-directory" className="btn btn-primary">Explore Our Services</a>
          <Link href="/discuss-a-project" className="btn btn-secondary">Discuss a Project</Link>
        </div>
        <p style={css("font-family:var(--font-heading);font-size:16px;margin:var(--space-5) 0 0;color:var(--om-azure);")}>One creative partner. Multiple professional solutions.</p>
      </section>

      <div className="hr" />

      <section id="service-directory" style={css("padding:var(--space-8) var(--space-6);scroll-margin-top:80px;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0 0 var(--space-3);")}>What We Do</h2>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:70ch;margin:0 0 var(--space-6);")}>
          Good work often needs more than one skill. A book may need writing, editing, formatting, cover design and promotion. A research project may need source development, editorial review, visual presentation and a clear public-facing summary. Ominet Digital connects these stages. Commission one service or bring us a larger project that needs several disciplines working together.
        </p>
        {ordered.length === 0 ? (
          <EmptyState title="No services available right now." body="Nothing here yet. Please check back soon." />
        ) : (
          <div className="omd-grid">
            {ordered.map((s, i) => (
              <ArtCard
                key={s.slug}
                href={`/services/${s.slug}`}
                kind="service"
                slug={s.slug}
                imageUrl={s.featuredImageUrl}
                kicker={`${String(i + 1).padStart(2, "0")}${s.category ? " · " + s.category : ""}`}
                title={s.title}
                description={s.shortDescription}
                meta={priceLabel(s)}
                cta="Explore service"
              />
            ))}
          </div>
        )}
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.12em;opacity:0.55;margin-bottom:var(--space-4);")}>HOW IT WORKS</div>
        <ol style={css("list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-6);")}>
          {[
            ["Tell us what you need", "Send a short brief, draft, reference or description of the project."],
            ["We review the scope", "We clarify the objective, audience, deliverables, formats and deadline."],
            ["You receive a proposal", "The recommended service, quotation, schedule and working terms."],
            ["Production begins", "Work proceeds against the agreed brief, with review points."],
            ["Review and refinement", "Consolidated feedback within the agreed revision scope."],
            ["Final delivery", "Approved files in the agreed formats."],
          ].map(([t, d], i) => (
            <li key={t} style={css("border-top:2px solid var(--om-cyan);padding-top:var(--space-3);")}>
              <div style={css("font-family:var(--font-heading);font-size:13px;opacity:0.5;")}>{String(i + 1).padStart(2, "0")}</div>
              <div style={css("font-family:var(--font-heading);font-size:18px;margin:2px 0 6px;")}>{t}</div>
              <div style={css("font-size:14px;line-height:1.6;opacity:0.7;")}>{d}</div>
            </li>
          ))}
        </ol>
      </section>

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0 0 var(--space-3);")}>Why Choose Ominet Digital?</h2>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.75;max-width:70ch;margin:0 0 var(--space-6);")}>Ominet Digital brings together capabilities that are often scattered across different providers. That combination lets a project keep a consistent direction from the first conversation to the final deliverable.</p>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--space-6);")}>
          {WHY.map(([t, d]) => (
            <div key={t} style={css("border-top:2px solid var(--om-cyan);padding-top:var(--space-3);")}>
              <h3 style={css("font-family:var(--font-heading);font-size:18px;margin:0 0 6px;")}>{t}</h3>
              <p style={css("font-size:14px;line-height:1.65;opacity:0.7;margin:0;")}>{d}</p>
            </div>
          ))}
        </div>
        <p style={css("font-size:15px;line-height:1.7;max-width:70ch;margin:var(--space-6) 0 0;font-style:italic;opacity:0.8;")}>We bring ideas, words, research and visual media into one considered process, so the finished work is not only attractive but ready to serve its purpose.</p>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);max-width:900px;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(26px,3.6vw,36px);margin:0 0 var(--space-5);")}>Frequently asked questions</h2>
        {FAQS.map(([q, a]) => (
          <details key={q} style={css("border-bottom:1px solid var(--color-border,#d9d3f0);padding:var(--space-3) 0;")}>
            <summary style={css("cursor:pointer;font-family:var(--font-heading);font-size:17px;min-height:32px;")}>{q}</summary>
            <p style={css("font-size:15px;line-height:1.7;opacity:0.8;margin:var(--space-2) 0 0;")}>{a}</p>
          </details>
        ))}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-indigo);color:#f1eefb;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,40px);margin:0 0 var(--space-3);color:#fff;")}>Have a project in mind?</h2>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.85;max-width:56ch;margin:0 0 var(--space-4);")}>Whether you are developing a book, preparing a research paper, building a brand, launching a product or producing a film, tell us what you are working on.</p>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <Link href="/discuss-a-project" className="btn btn-primary">Discuss Your Project</Link>
          <a href={waLink("Hello Ominet Digital, I have a project I would like to discuss.")} className="btn btn-secondary" style={css("color:#fff;border-color:rgba(255,255,255,0.4);")} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
