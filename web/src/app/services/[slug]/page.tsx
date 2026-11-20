import Link from "next/link";
import RichText from "@/components/RichText";
import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PreviewBanner from "@/components/PreviewBanner";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import ShareBar from "@/components/ShareBar";
import TrackedLink from "@/components/TrackedLink";
import BookingForm from "@/components/BookingForm";
import RelatedSection from "@/components/RelatedSection";
import { css } from "@/lib/css";
import { getService } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { flavourOf, mapOption, optionPriceLabel, OPTION_COLS, type OptionRow } from "@/lib/service-options";
import { SITE_URL } from "@/lib/seo";
import { ogImage } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/site-settings";
import { formatMoney } from "@/lib/money";
import { getOrganizationSchema, breadcrumbSchema, jsonLdGraph } from "@/lib/schema";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service" };
  const { identity } = await getSiteSettings();
  const title = service.seoTitle || `${service.title} — ${identity.siteName}`;
  const description = service.seoDescription || service.shortDescription || `${service.title} — a service from ${identity.siteName}.`;
  const url = `${SITE_URL}/services/${service.slug}`;
  const image = ogImage(service.ogImageUrl || service.featuredImageUrl);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(service.status && service.status !== "published" ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, url, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function priceLabel(service: { pricingMode: string; priceCents: number | null; currency: string }) {
  if (service.pricingMode === "quote" || service.priceCents == null) return "Quote on request";
  const amount = formatMoney(service.priceCents, service.currency);
  return service.pricingMode === "hourly" ? `${amount} / hour` : service.pricingMode === "package" ? `${amount} / package` : amount;
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const { identity: siteIdentity, contact } = await getSiteSettings();
  const flavour = flavourOf(service.slug);
  let options: ReturnType<typeof mapOption>[] = [];
  if (flavour) {
    const db = await createClient();
    const { data } = await db!.from("service_options").select(OPTION_COLS).eq("service_id", service.id).eq("active", true).order("display_order");
    options = ((data ?? []) as OptionRow[]).map(mapOption);
  }
  const optionGroups = Array.from(new Set(options.map((o) => o.group ?? "")));
  const ctaLabel = service.ctaLabel || (service.pricingMode === "quote" ? "Request a quote" : "Book this service");

  const jsonLd = jsonLdGraph([
    {
      "@type": "Service",
      "@id": `${SITE_URL}/services/${service.slug}#service`,
      name: service.title,
      description: service.shortDescription,
      provider: getOrganizationSchema(siteIdentity.siteName),
      areaServed: service.locationMode === "remote" ? "Remote" : undefined,
      url: `${SITE_URL}/services/${service.slug}`,
    },
    ...(service.faq.length ? [{ "@type": "FAQPage", mainEntity: service.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }] : []),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: service.title, path: `/services/${service.slug}` },
    ]),
  ]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PreviewBanner status={service.status} editHref={service.id ? `/admin/services/${service.id}` : undefined} />
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--space-8);")}>
        <div style={css("aspect-ratio:1/1.414;position:relative;border-radius:var(--radius-md);overflow:hidden;flex:1 1 240px;max-width:320px;box-shadow:var(--shadow-md);")}>
          {service.featuredImageUrl ? (
            <Image src={service.featuredImageUrl} alt="" fill sizes="(max-width: 700px) 90vw, 320px" style={{ objectFit: "cover" }} priority />
          ) : (
            <PlaceholderImage kind="service" slug={service.slug} title={service.title} portrait />
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

          {service.bookingEnabled && options.length > 0 ? (
            <Link className="btn btn-primary" href={`/services/${service.slug}/request`}>{service.ctaLabel || "Make a request"}</Link>
          ) : service.bookingEnabled ? (
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
              <BookingForm serviceId={service.id} serviceTitle={service.title} ctaLabel={ctaLabel} supportEmail={contact.bookingEmail} />
            )
          ) : (
            <p style={css("font-size:13px;opacity:0.5;")}>Not currently bookable.</p>
          )}
          {!options.length && <p style={css("font-size:14px;margin:var(--space-3) 0 0;")}>
            Have a bigger brief? <Link href={`/discuss-a-project?service=${service.slug}`}>Send a detailed project enquiry</Link>.
          </p>}

          <div style={css("margin-top:var(--space-6);")}>
            <ShareBar url={`${SITE_URL}/services/${service.slug}`} title={service.title} />
          </div>
        </div>
      </section>

      {options.length > 0 && (
        <section aria-labelledby="options-h" style={css("max-width:860px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
          <h2 id="options-h" style={css("font-family:var(--font-heading);font-size:26px;margin:0 0 var(--space-4);")}>Available options</h2>
          {optionGroups.map((g) => (
            <div key={g || "all"} style={css("margin-bottom:var(--space-5);")}>
              {g && flavour === "cac" && <h3 style={css("font-size:13px;letter-spacing:0.08em;opacity:0.6;margin:0 0 var(--space-2);")}>{g.toUpperCase()}</h3>}
              <ul style={css("list-style:none;margin:0;padding:0;display:grid;gap:var(--space-2);")}>
                {options.filter((o) => (o.group ?? "") === g).map((o) => (
                  <li key={o.key} style={css("display:flex;gap:var(--space-3);justify-content:space-between;align-items:center;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--color-border,#d9d3f0);border-radius:var(--radius-md);")}>
                    <div style={css("flex:1 1 260px;")}>
                      <div style={css("font-weight:600;font-size:15px;")}>{o.label}</div>
                      {o.description && <div style={css("font-size:13px;opacity:0.7;")}>{o.description}</div>}
                      <div style={css("font-size:12px;opacity:0.7;margin-top:2px;")}>{o.duration ? `Estimated time: ${o.duration}. ` : ""}Professional fee: {optionPriceLabel(o)}{o.officialFeeCents != null ? `. Official charge shown separately in your quotation.` : ""}</div>
                    </div>
                    {service.bookingEnabled && <Link className="btn btn-secondary" href={`/services/${service.slug}/request?option=${o.key}`}>Select</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p style={css("font-size:12px;opacity:0.65;margin:0;")}>Estimated times are estimates, not guarantees. Ominet Digital is an independent business and is not a government body.</p>
        </section>
      )}

      {service.fullDescription && (
        <>
          <div className="hr" />
          <section style={css("max-width:720px;margin:0 auto;padding:var(--space-8) var(--space-6);font-size:17px;line-height:1.8;")}>
            <RichText html={service.fullDescription} />
          </section>
        </>
      )}

      {service.requirements && (
        <section style={css("max-width:720px;margin:0 auto;padding:0 var(--space-6) var(--space-8);")}>
          <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>WHAT TO PREPARE</div>
          <RichText html={service.requirements} style={css("font-size:15px;line-height:1.7;opacity:0.8;")} />
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
      <RelatedSection type="service" id={service.id} />

      <Footer />
    </div>
  );
}
