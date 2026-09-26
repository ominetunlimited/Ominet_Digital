import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import EmptyState from "@/components/EmptyState";
import { css } from "@/lib/css";
import { getServices } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { formatMoney } from "@/lib/money";

export const metadata = pageMetadata(
  "Services",
  "Writing, photography, video, design and consulting services from Ominet Digital / Omini Nfawa.",
  "/services"
);
export const revalidate = 60;

function priceLabel(service: { pricingMode: string; priceCents: number | null; currency: string }) {
  if (service.pricingMode === "quote" || service.priceCents == null) return "Quote on request";
  const amount = formatMoney(service.priceCents, service.currency);
  return service.pricingMode === "hourly" ? `${amount} / hour` : amount;
}

export default async function ServicesPage() {
  const services = await getServices();
  const featured = services.filter((s) => s.featured);
  const rest = services.filter((s) => !s.featured);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>SERVICES</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Services</h1>
        <p style={css("font-size:16px;opacity:0.7;max-width:56ch;margin:var(--space-3) 0 0;")}>
          Writing, photography, video, design and consulting — booked directly, no account required.
        </p>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-6);")}>
        {services.length === 0 ? (
          <EmptyState title="No services available right now." body="Nothing here yet. Please check back soon." />
        ) : (
          <>
            {featured.length > 0 && (
              <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-6);margin-bottom:var(--space-8);")}>
                {featured.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`}>
                    <div style={css("aspect-ratio:1/1.414;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);box-shadow:var(--shadow-md);")}>
                      {s.featuredImageUrl ? (
                        <Image src={s.featuredImageUrl} alt="" fill sizes="(max-width: 700px) 45vw, 260px" style={{ objectFit: "cover" }} />
                      ) : (
                        <PlaceholderImage label="Service" />
                      )}
                    </div>
                    {s.category && <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.5;margin-bottom:2px;")}>{s.category.toUpperCase()}</div>}
                    <div style={css("font-family:var(--font-heading);font-size:18px;")}>{s.title}</div>
                    <div style={css("font-size:13px;opacity:0.6;")}>{priceLabel(s)}</div>
                  </Link>
                ))}
              </div>
            )}

            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space-5);")}>
              {rest.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  <div style={css("aspect-ratio:1/1.414;position:relative;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);")}>
                    {s.featuredImageUrl ? (
                      <Image src={s.featuredImageUrl} alt="" fill sizes="180px" style={{ objectFit: "cover" }} />
                    ) : (
                      <PlaceholderImage label="Service" />
                    )}
                  </div>
                  {s.category && <div style={css("font-size:11px;letter-spacing:0.08em;opacity:0.5;margin-bottom:2px;")}>{s.category.toUpperCase()}</div>}
                  <div style={css("font-family:var(--font-heading);font-size:16px;")}>{s.title}</div>
                  <div style={css("font-size:12px;opacity:0.55;")}>{priceLabel(s)}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
