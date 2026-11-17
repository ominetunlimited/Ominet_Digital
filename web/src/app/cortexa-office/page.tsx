import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ComingSoon from "@/components/ComingSoon";
import PartnersStrip from "@/components/PartnersStrip";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";
import { getPartnerApps } from "@/lib/data";

export async function generateMetadata() {
  const meta = await pageMetadata(
    "Cortexa Office",
    "An emerging product and office within the Ominet Digital ecosystem.",
    "/cortexa-office"
  );
  const { ecosystem } = await getSiteSettings();
  return ecosystem.cortexaVisible ? meta : { ...meta, robots: { index: false, follow: false } };
}

// Set NEXT_PUBLIC_CORTEXA_APP_URL to the app's own ominetdigital.com.ng address once it is mapped; until then it falls back to its current deployment.
const CORTEXA_URL = process.env.NEXT_PUBLIC_CORTEXA_APP_URL || "https://cortexa-office.vercel.app/";

export default async function CortexaOfficePage() {
  const [{ ecosystem }, partnerApps] = await Promise.all([getSiteSettings(), getPartnerApps()]);
  if (!ecosystem.cortexaVisible) return <ComingSoon label="CORTEXA OFFICE" message={ecosystem.cortexaMessage} />;
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="360" height="360" viewBox="0 0 360 360" style={css("position:absolute;right:-100px;top:10px;pointer-events:none;")} aria-hidden="true">
        <rect x="1" y="1" width="358" height="358" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.14" />
        <circle cx="180" cy="180" r="120" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.12" />
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ECOSYSTEM &middot; OMINET DIGITAL</div>
        <h1 style={css("font-family:var(--font-heading);font-size:clamp(36px,5vw,52px);margin:0 0 var(--space-4);")}>Cortexa Office</h1>
        <p style={css("font-size:18px;line-height:1.6;opacity:0.75;max-width:56ch;margin:0 0 var(--space-6);")}>An emerging product and office within the Ominet Digital ecosystem. Details are still taking shape.</p>
        <a href={CORTEXA_URL} target="_blank" rel="noopener noreferrer">
          <button type="button" className="btn btn-primary">Visit Cortexa Office &#8599;</button>
        </a>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4);")}>
          <div className="card"><div className="card-kicker">OFFICE</div><p className="card-body">Information, mission and location &mdash; coming soon.</p></div>
          <div className="card"><div className="card-kicker">SERVICES</div><p className="card-body">What Cortexa Office offers &mdash; to be defined.</p></div>
          <div className="card"><div className="card-kicker">TOOLS</div><p className="card-body">Applications and tools built here &mdash; to be defined.</p></div>
          <div className="card"><div className="card-kicker">CONTACT</div><p className="card-body">Reach the team &mdash; details to follow.</p></div>
        </div>
      </section>

      <div className="hr" />
      <PartnersStrip apps={partnerApps} />
      <Footer />
    </div>
  );
}
