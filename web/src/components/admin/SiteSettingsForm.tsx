"use client";

import { useState, type ReactNode } from "react";
import { css } from "@/lib/css";
import { useAdminAction } from "@/lib/admin/useAdminAction";
import SaveButton from "@/components/admin/SaveButton";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { saveSiteSettings } from "@/lib/admin/site-settings-actions";
import type { SectionName, SiteSettings } from "@/lib/site-settings-validate";

function Section({ title, hint, section, data, children }: { title: string; hint: string; section: SectionName; data: unknown; children: ReactNode }) {
  const { busy, saved, error, run } = useAdminAction();
  return (
    <div className="card" style={css("gap:var(--space-3);margin-bottom:var(--space-4);")}>
      <div>
        <div style={css("font-family:var(--font-heading);font-size:18px;")}>{title}</div>
        <div style={css("font-size:12px;opacity:0.6;margin-top:2px;")}>{hint}</div>
      </div>
      {children}
      {error && <p style={css("font-size:13px;color:var(--om-coral);margin:0;")}>{error}</p>}
      <div>
        <SaveButton busy={busy} saved={saved} idleLabel="Save" onClick={() => void run(() => saveSiteSettings(section, data))} />
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div style={css("font-size:12px;opacity:0.55;margin-top:4px;")}>{hint}</div>}
    </div>
  );
}

export default function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const [identity, setIdentity] = useState(initial.identity);
  const [contact, setContact] = useState(initial.contact);
  const [social, setSocial] = useState(initial.social);
  const [seo, setSeo] = useState(initial.seo);
  const [footer, setFooter] = useState(initial.footer);
  const [homepage, setHomepage] = useState(initial.homepage);
  const [about, setAbout] = useState(initial.about);
  const [ecosystem, setEcosystem] = useState(initial.ecosystem);

  return (
    <div style={css("max-width:720px;")}>
      <Section title="Homepage" hint="The hero banner at the top of the homepage, and its Recent Writing list. Featured Book is set per-book (Books admin -> Featured), and Featured articles per-article (Content admin -> Featured)." section="homepage" data={homepage}>
        <ImageUploadField label="Hero image (optional — leave blank to keep the default)" value={homepage.heroImageUrl} onChange={(url) => setHomepage({ ...homepage, heroImageUrl: url })} />
        <Field label="Hero heading" hint="A line break here starts a new line in the heading.">
          <textarea className="input" rows={2} value={homepage.heroHeading} onChange={(e) => setHomepage({ ...homepage, heroHeading: e.target.value })} />
        </Field>
        <Field label="Hero subheading">
          <textarea className="input" rows={2} value={homepage.heroSubheading} onChange={(e) => setHomepage({ ...homepage, heroSubheading: e.target.value })} />
        </Field>
        <label className="radio" style={css("margin-top:var(--space-2);")}>
          <input
            type="checkbox"
            checked={homepage.showRecentWriting}
            onChange={(e) => setHomepage({ ...homepage, showRecentWriting: e.target.checked })}
            style={{ position: "static", width: "auto", height: "auto", opacity: 1 }}
          />
          Show a &ldquo;Recent writing&rdquo; list of your latest articles in the hero
        </label>
      </Section>

      <Section title="About page" hint="Your photo and write-up on the About page." section="about" data={about}>
        <ImageUploadField label="Photo (optional — leave blank to keep the current one)" value={about.photoUrl} onChange={(url) => setAbout({ ...about, photoUrl: url })} />
        <Field label="Tagline">
          <input className="input" value={about.tagline} onChange={(e) => setAbout({ ...about, tagline: e.target.value })} />
        </Field>
        <Field label="Intro line (shown in italics)">
          <input className="input" value={about.intro} onChange={(e) => setAbout({ ...about, intro: e.target.value })} />
        </Field>
        <Field label="Bio" hint="Paragraphs separated by a blank line.">
          <textarea className="input" rows={14} value={about.bio} onChange={(e) => setAbout({ ...about, bio: e.target.value })} />
        </Field>
      </Section>

      <Section
        title="Ecosystem pages"
        hint="PROFILE and Cortexa Office are separate products still under development. While hidden: the page shows a short coming-soon message instead of its real content, it's removed from the nav and footer, and it's excluded from search engines. Direct links still resolve to that coming-soon page — nothing is password-protected."
        section="ecosystem"
        data={ecosystem}
      >
        <label className="radio">
          <input
            type="checkbox"
            checked={ecosystem.profileVisible}
            onChange={(e) => setEcosystem({ ...ecosystem, profileVisible: e.target.checked })}
            style={{ position: "static", width: "auto", height: "auto", opacity: 1 }}
          />
          PROFILE is ready — show it publicly
        </label>
        {!ecosystem.profileVisible && (
          <Field label="Coming-soon message for PROFILE">
            <input className="input" value={ecosystem.profileMessage} onChange={(e) => setEcosystem({ ...ecosystem, profileMessage: e.target.value })} />
          </Field>
        )}
        <label className="radio" style={css("margin-top:var(--space-3);")}>
          <input
            type="checkbox"
            checked={ecosystem.cortexaVisible}
            onChange={(e) => setEcosystem({ ...ecosystem, cortexaVisible: e.target.checked })}
            style={{ position: "static", width: "auto", height: "auto", opacity: 1 }}
          />
          Cortexa Office is ready — show it publicly
        </label>
        {!ecosystem.cortexaVisible && (
          <Field label="Coming-soon message for Cortexa Office">
            <input className="input" value={ecosystem.cortexaMessage} onChange={(e) => setEcosystem({ ...ecosystem, cortexaMessage: e.target.value })} />
          </Field>
        )}
      </Section>

      <Section title="Site identity" hint="The name and description search engines and social networks show for the whole site." section="identity" data={identity}>
        <Field label="Site name" hint="Added to every page title, e.g. “Books — Your Site Name”.">
          <input className="input" value={identity.siteName} onChange={(e) => setIdentity({ ...identity, siteName: e.target.value })} />
        </Field>
        <Field label={`Description (${identity.description.length}/300)`}>
          <textarea className="input" rows={3} value={identity.description} onChange={(e) => setIdentity({ ...identity, description: e.target.value })} />
        </Field>
        <p style={css("font-size:12px;opacity:0.6;margin:0;")}>Logo: the site uses the supplied Ominet Digital logo everywhere; it is fixed and isn&apos;t editable here.</p>
      </Section>

      <Section title="Contact" hint="Where visitors are told to reach you. Shown in the footer's Contact link, on booking confirmations and in booking error messages." section="contact" data={contact}>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <div style={css("flex:1;min-width:220px;")}>
            <Field label="Support email">
              <input className="input" type="email" value={contact.supportEmail} onChange={(e) => setContact({ ...contact, supportEmail: e.target.value })} />
            </Field>
          </div>
          <div style={css("flex:1;min-width:220px;")}>
            <Field label="Booking email">
              <input className="input" type="email" value={contact.bookingEmail} onChange={(e) => setContact({ ...contact, bookingEmail: e.target.value })} />
            </Field>
          </div>
        </div>
        <Field label="Phone (optional)">
          <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+234 …" />
        </Field>
        <Field label="WhatsApp number (optional)" hint="Leave blank until your WhatsApp Business is set up — the icon only appears once this is filled in. Include the country code.">
          <input className="input" value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} placeholder="+234 …" />
        </Field>
      </Section>

      <Section title="Social links" hint="Icons in the top bar, hero and footer. Each link must be a real profile on that network. Untick to hide one." section="social" data={social}>
        {social.map((s, i) => (
          <div key={s.platform} style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:flex-end;")}>
            <div style={css("flex:1;min-width:110px;max-width:130px;font-size:14px;padding-bottom:10px;")}>{s.label}</div>
            <div className="field" style={css("flex:3;min-width:220px;")}>
              <input
                className="input"
                aria-label={`${s.label} profile link`}
                value={s.url}
                placeholder="https://…"
                onChange={(e) => setSocial(social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              />
            </div>
            <label className="radio" style={css("padding-bottom:10px;font-size:13px;")}>
              <input type="checkbox" checked={s.enabled} onChange={(e) => setSocial(social.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} style={{ position: "static", width: "auto", height: "auto", opacity: 1 }} />
              Show
            </label>
          </div>
        ))}
      </Section>

      <Section title="Search & sharing" hint="Favicon, the picture used when a page is shared without its own image, and Google Search Console verification." section="seo" data={seo}>
        <ImageUploadField label="Favicon (browser tab icon — a square PNG works best)" value={seo.faviconUrl} onChange={(url) => setSeo({ ...seo, faviconUrl: url })} />
        <ImageUploadField label="Default share image (about 1200 × 630)" value={seo.defaultOgImageUrl} onChange={(url) => setSeo({ ...seo, defaultOgImageUrl: url })} />
        <Field label="Google Search Console verification code" hint="Just the code from <meta name=&quot;google-site-verification&quot; content=&quot;…&quot;>. Leave blank if you haven't set it up.">
          <input className="input" value={seo.googleVerification} onChange={(e) => setSeo({ ...seo, googleVerification: e.target.value })} />
        </Field>
      </Section>

      <Section title="Footer & legal" hint="The text and links at the bottom of every page." section="footer" data={footer}>
        <Field label={`Footer text (${footer.blurb.length}/300)`}>
          <textarea className="input" rows={2} value={footer.blurb} onChange={(e) => setFooter({ ...footer, blurb: e.target.value })} />
        </Field>
        <Field label="Name shown after © and the year">
          <input className="input" value={footer.copyrightName} onChange={(e) => setFooter({ ...footer, copyrightName: e.target.value })} />
        </Field>
        <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
          <div style={css("flex:1;min-width:220px;")}>
            <Field label="Privacy policy link (optional)" hint="Only shown in the footer once you fill it in.">
              <input className="input" value={footer.privacyUrl} onChange={(e) => setFooter({ ...footer, privacyUrl: e.target.value })} placeholder="/privacy or https://…" />
            </Field>
          </div>
          <div style={css("flex:1;min-width:220px;")}>
            <Field label="Terms link (optional)">
              <input className="input" value={footer.termsUrl} onChange={(e) => setFooter({ ...footer, termsUrl: e.target.value })} placeholder="/terms or https://…" />
            </Field>
          </div>
        </div>
      </Section>
    </div>
  );
}
