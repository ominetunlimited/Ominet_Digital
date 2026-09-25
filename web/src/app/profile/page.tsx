import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "PROFILE",
  "A verified record of activity, attribution and identity — carried between opportunities instead of rebuilt for each one.",
  "/profile"
);

const PROFILE_APP_URL = "https://profile-app-sand.vercel.app/";

const steps = [
  { n: "01", title: "Activity", body: "Your work is logged as it happens." },
  { n: "02", title: "Verification", body: "Claims are checked against a source." },
  { n: "03", title: "Attribution", body: "Credit stays attached to the work." },
  { n: "04", title: "Identity", body: "One record, built over time." },
  { n: "05", title: "CV / Portfolio", body: "Generated from what's verified." },
  { n: "06", title: "Opportunity", body: "Shared where it matters." },
];

export default function ProfilePage() {
  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);")}>
      <Nav />

      <section style={css("padding:var(--space-8) var(--space-6);position:relative;overflow:hidden;")}>
        <svg width="480" height="480" viewBox="0 0 480 480" style={css("position:absolute;right:-140px;top:-140px;pointer-events:none;")} aria-hidden="true">
          <circle cx="240" cy="240" r="239" fill="none" stroke="var(--om-blue)" strokeWidth="1" opacity="0.3" />
          <circle cx="240" cy="240" r="160" fill="none" stroke="var(--om-blue)" strokeWidth="1" opacity="0.22" />
          <circle cx="240" cy="240" r="80" fill="none" stroke="var(--om-blue)" strokeWidth="1" opacity="0.18" />
        </svg>
        <div style={css("position:relative;max-width:720px;")}>
          <div style={css("font-family:var(--font-heading);font-size:14px;font-weight:800;letter-spacing:0.1em;color:var(--om-blue);margin-bottom:var(--space-3);")}>PROFILE</div>
          <h1 style={css("font-family:var(--font-heading);font-size:clamp(36px,5vw,56px);line-height:1.05;margin:0 0 var(--space-4);")}>Your professional identity should be more than a CV.</h1>
          <p style={css("font-size:18px;line-height:1.6;opacity:0.75;max-width:56ch;margin:0 0 var(--space-6);")}>A verified record of activity, attribution and identity &mdash; carried between opportunities instead of rebuilt for each one.</p>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            <a href={PROFILE_APP_URL} target="_blank" rel="noopener noreferrer">
              <button type="button" className="btn btn-primary" style={css("background:var(--om-blue);border-color:var(--om-blue);")}>Explore Profile</button>
            </a>
            <a href={PROFILE_APP_URL} target="_blank" rel="noopener noreferrer">
              <button type="button" className="btn btn-secondary" style={css("border-color:var(--om-blue);color:var(--om-blue);")}>Create Profile</button>
            </a>
            <a href={PROFILE_APP_URL} target="_blank" rel="noopener noreferrer" style={css("align-self:center;")}>Log in</a>
          </div>
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-4);")}>HOW IT WORKS</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-4);")}>
          {steps.map((s) => (
            <div key={s.n}>
              <div style={css("font-family:var(--font-heading);font-size:22px;color:var(--om-blue);margin-bottom:var(--space-1);")}>{s.n}</div>
              <div style={css("font-weight:700;margin-bottom:var(--space-1);")}>{s.title}</div>
              <p style={css("font-size:13px;opacity:0.65;margin:0;")}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);background:var(--om-blue);color:var(--om-mist);text-align:center;")}>
        <div style={css("font-family:var(--font-heading);font-size:28px;margin-bottom:var(--space-4);")}>PROFILE is a separate product, built by Ominet Digital.</div>
        <a href={PROFILE_APP_URL} target="_blank" rel="noopener noreferrer">
          <button type="button" className="btn" style={css("background:var(--om-mist);border-color:var(--om-mist);color:var(--om-blue);")}>Visit profile.app &#8599;</button>
        </a>
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
