import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ServiceOptionForm from "@/components/ServiceOptionForm";
import { css } from "@/lib/css";
import { getService } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { flavourOf, mapOption, optionPriceLabel, OPTION_COLS, type OptionRow } from "@/lib/service-options";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return { title: "Request" };
  return { title: `Request: ${s.title}`, alternates: { canonical: `${SITE_URL}/services/${slug}/request` }, robots: { index: false, follow: true } };
}

export default async function RequestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ option?: string }> }) {
  const [{ slug }, { option }] = await Promise.all([params, searchParams]);
  const flavour = flavourOf(slug);
  const service = flavour ? await getService(slug) : undefined;
  if (!flavour || !service || service.status !== "published" || !service.bookingEnabled) notFound();
  const db = await createClient();
  const { data } = await db!.from("service_options").select(OPTION_COLS).eq("service_id", service.id).eq("active", true).order("display_order");
  const options = ((data ?? []) as OptionRow[]).map(mapOption).map((o) => ({ key: o.key, label: o.label, group: o.group, duration: o.duration, priceLabel: optionPriceLabel(o), description: o.description }));
  if (!options.length) notFound();
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />
      <main style={css("padding:var(--space-8) var(--space-6);")}>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(28px,4vw,44px);line-height:1.15;margin:0 0 var(--space-3);max-width:780px;")}>{service.title}</h1>
        <p style={css("font-size:16px;line-height:1.7;opacity:0.8;max-width:680px;margin:0 0 var(--space-6);")}>{service.shortDescription}</p>
        <ServiceOptionForm serviceSlug={service.slug} flavour={flavour} options={options} preselect={option} />
      </main>
      <Footer />
    </div>
  );
}
