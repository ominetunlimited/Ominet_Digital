import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import ShareBar from "@/components/ShareBar";
import TrackedLink from "@/components/TrackedLink";
import { css } from "@/lib/css";
import { getService } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

const SUPPORT_EMAIL = "ominetmedia@gmail.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service — Ominet Digital" };
  const title = service.seoTitle || `${service.title} — Ominet Digital`;
  const description = service.seoDescription || service.shortDescription || `${service.title} — a service from Ominet Digital.`;
  const url = `${SITE_URL}/services/${service.slug}`;
  const image = service.ogImageUrl || service.featuredImageUrl;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

function priceLabel(service: { pricingMode: string; priceCents: number | null; currency: string }) {
  if (service.pricingMode === "quote" || service.priceCents == null) return "Quote on request";
  const symbol = service.currency === "NGN" ? "₦" : service.currency === "USD" ? "$" : `${service.currency} `;
  const amount = `${symbol}${(service.priceCents / 100).toLocaleString()}`;
  return service.pricingMode === "hourly" ? `${amount} / hour` : service.pricingMode === "package" ? `${amount} / package` : amount;
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const ctaLabel = service.ctaLabel || (service.pricingMode === "quote" ? "Request a quote" : "Book this service");
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Enquiry: ${service.title}`)}&body=${encodeURIComponent(`Hi Ominet Digital,\n\nI'd like to enquire about "${service.title}".\n\n`)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    provider: { "@type": "Organization", name: "Ominet Digital" },
    areaServed: service.locationMode === "remote" ? "Remote" : undefined,
  };

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:1/1.414;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:320px;box-shadow:var(--shadow-md);")}>
          {service.featuredImageUrl ? (
            <Image src={service.featuredImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 320px" style={{ objectFit: "cover" }} priority />
          ) : (
            <PlaceholderImage label="Service" />
          )}
        </div>
        <div style={css("flex:2 1 380px;")}>
          {service.category && <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>{service.category.toUpperCase()}</div>}
          <h1 style={css("font-family:var(--font-heading);font-size:44px;margin:0 0 var(--space-2);")}>{service.title}</h1>
          {service.shortDescription && <p style={css("font-size:17px;line-height:1.7;opacity:0.8;max-width:56ch;margin:0 0 var(--space-4);")}>{service.shortDescription}</p>}

          <div style={css("display:flex;gap:var(--space-5);flex-wrap:wrap;font-size:13px;opacity:0.7;margin-bottom:var(--space-5);")}>
            <div><strong style={css("display:block;font-size:11px;opacity:0.6;")}>PRICE</strong>{priceLabel(service)}</div>
            {service.duration && <div><strong style={css("display:block;font-size:11px;opacity:0.6;")}>DURATION</strong>{service.duration}</div>}
            {service.availability && <div><strong style={css("display:block;font-size:11px;opacity:0.6;")}>AVAILABILITY</strong>{service.availability}</div>}
            <div><strong style={css("display:block;font-size:11px;opacity:0.6;")}>LOCATION</strong>{service.locationMode === "in_person" ? "In person" : service.locationMode === "hybrid" ? "Hybrid" : "Remote"}</div>
          </div>

          {service.bookingEnabled ? (
            service.externalBookingUrl ? (
              <TrackedLink
                href={service.externalBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                eventMetadata={{ kind: "service_booking", service_slug: service.slug }}
              >
                {ctaLabel}
              </TrackedLink>
            ) : (
              <TrackedLink href={mailtoHref} className="btn btn-primary" eventMetadata={{ kind: "service_enquiry_email", service_slug: service.slug }}>
                {ctaLabel}
              </TrackedLink>
            )
          ) : (
            <p style={css("font-size:13px;opacity:0.5;")}>Not currently bookable.</p>
          )}

          <div style={css("margin-top:var(--space-6);")}>
            <ShareBar url={`${SITE_URL}/services/${service.slug}`} title={service.title} />
          </div>
        </div>
      </section>

      {service.fullDescription && (
        <>
          <div className="hr" />
          <section style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);font-size:17px;line-height:1.8;")}>
            {service.fullDescription.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </section>
        </>
      )}

      {service.requirements && (
        <section style={css("max-width:720px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>WHAT TO PREPARE</div>
          <p style={css("font-size:15px;line-height:1.7;opacity:0.8;")}>{service.requirements}</p>
        </section>
      )}

      {service.faq.length > 0 && (
        <section style={css("max-width:720px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>FAQ</div>
          <div style={css("display:grid;gap:var(--space-4);")}>
            {service.faq.map((f, i) => (
              <div key={i}>
                <div style={css("font-family:var(--font-heading);font-size:16px;margin-bottom:var(--space-1);")}>{f.question}</div>
                <p style={css("font-size:14px;line-height:1.6;opacity:0.75;margin:0;")}>{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="hr" />
      <Footer />
    </div>
  );
}
