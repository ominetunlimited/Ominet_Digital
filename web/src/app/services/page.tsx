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
  "Services",
  "Writing, research, publishing, design, photography, video and digital communication services from Ominet Digital.",
  "/services"
);
export const revalidate = 60;

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
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(34px,5vw,56px);line-height:1.08;margin:0;")}>Ideas deserve more than attention. They deserve excellent execution.</h1>
        <p style={css("font-size:17px;line-height:1.7;opacity:0.75;max-width:64ch;margin:var(--space-4) 0 var(--space-5);")}>
          Writing, research, publishing, design and multimedia under one creative roof. Commission one service, or bring a larger project that needs several disciplines working together.
        </p>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <a href="#service-directory" className="btn btn-primary">Explore our services</a>
          <a href={waLink("Hello Ominet Digital, I would like to discuss a project.")} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">Discuss a project</a>
        </div>
      </section>

      <div className="hr" />

      <section id="service-directory" style={css("padding:var(--space-8) var(--space-6);scroll-margin-top:80px;")}>
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

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-indigo);color:#f1eefb;")}>
        <h2 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,40px);margin:0 0 var(--space-3);color:#fff;")}>Have a project in mind?</h2>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.85;max-width:56ch;margin:0 0 var(--space-4);")}>Whether you are developing a book, preparing a research paper, building a brand or producing a film, tell us what you are working on.</p>
        <a href={waLink("Hello Ominet Digital, I have a project I would like to discuss.")} className="btn btn-primary" target="_blank" rel="noopener noreferrer">Discuss your project</a>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
