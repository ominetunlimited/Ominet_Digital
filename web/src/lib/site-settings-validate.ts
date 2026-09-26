// Site settings: shape, defaults and validation. Dependency-free so it can be
// unit-tested. Everything stored here is PUBLIC (the site_settings table is
// publicly readable) — credentials and tokens never belong in it.

import { validateDestination, validateImageUrl } from "./ad-validate";

export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin";
export type SocialLink = { platform: SocialPlatform; label: string; url: string; enabled: boolean };

export type SiteSettings = {
  identity: { siteName: string; description: string };
  contact: { supportEmail: string; bookingEmail: string; phone: string };
  social: SocialLink[];
  seo: { faviconUrl: string; defaultOgImageUrl: string; googleVerification: string };
  footer: { blurb: string; copyrightName: string; privacyUrl: string; termsUrl: string };
};

export type SectionName = keyof SiteSettings;
export const SECTION_KEYS: Record<SectionName, string> = {
  identity: "site_identity",
  contact: "site_contact",
  social: "site_social",
  seo: "site_seo",
  footer: "site_footer",
};

const DESCRIPTION = "A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.";

/** What the site showed before settings existed — nothing changes until an admin edits something. */
export const DEFAULT_SETTINGS: SiteSettings = {
  identity: { siteName: "Ominet Digital", description: DESCRIPTION },
  contact: { supportEmail: "ominetmedia@gmail.com", bookingEmail: "ominetmedia@gmail.com", phone: "" },
  social: [
    { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/OminetUnlimited", enabled: true },
    { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/ominetunlimited/", enabled: true },
    { platform: "x", label: "X", url: "https://x.com/ominetmedia", enabled: true },
    { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/ominet", enabled: true },
  ],
  seo: { faviconUrl: "", defaultOgImageUrl: "", googleVerification: "" },
  footer: { blurb: DESCRIPTION, copyrightName: "Ominet Digital", privacyUrl: "", termsUrl: "" },
};

export const PLATFORM_HOSTS: Record<SocialPlatform, string[]> = {
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateIdentity(input: unknown): Result<SiteSettings["identity"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const siteName = str(o.siteName, 200);
  if (!siteName) return { ok: false, error: "Enter the site name." };
  if (siteName.length > 80) return { ok: false, error: "Keep the site name under 80 characters." };
  const description = str(o.description, 1000);
  if (description.length > 300) return { ok: false, error: "Keep the description under 300 characters (search engines cut it off)." };
  return { ok: true, value: { siteName, description } };
}

export function validateContact(input: unknown): Result<SiteSettings["contact"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const supportEmail = str(o.supportEmail, 200);
  const bookingEmail = str(o.bookingEmail, 200);
  const phone = str(o.phone, 60);
  if (!EMAIL_RE.test(supportEmail)) return { ok: false, error: "Enter a valid support email." };
  if (!EMAIL_RE.test(bookingEmail)) return { ok: false, error: "Enter a valid booking email." };
  if (phone && !/^[+\d][\d\s().-]{4,38}$/.test(phone)) return { ok: false, error: "That phone number doesn't look right." };
  return { ok: true, value: { supportEmail, bookingEmail, phone } };
}

export function validateSocial(input: unknown): Result<SiteSettings["social"]> {
  if (!Array.isArray(input)) return { ok: false, error: "Nothing to save." };
  const out: SocialLink[] = [];
  const seen = new Set<string>();
  for (const raw of input.slice(0, 10)) {
    const o = (raw ?? {}) as Record<string, unknown>;
    const platform = o.platform as SocialPlatform;
    if (!(platform in PLATFORM_HOSTS)) return { ok: false, error: "Unknown social network." };
    if (seen.has(platform)) return { ok: false, error: "Each network can only be listed once." };
    seen.add(platform);
    const enabled = Boolean(o.enabled);
    const label = str(o.label, 40) || platform;
    const urlText = str(o.url, 300);
    if (!urlText && !enabled) {
      out.push({ platform, label, url: "", enabled: false });
      continue;
    }
    const checked = validateDestination(urlText);
    if (!checked.ok || checked.url.startsWith("/")) return { ok: false, error: `${label}: enter the full https:// address of your profile.` };
    const host = new URL(checked.url).hostname.toLowerCase();
    if (!PLATFORM_HOSTS[platform].includes(host)) return { ok: false, error: `${label}: that link doesn't go to ${label}.` };
    out.push({ platform, label, url: checked.url, enabled });
  }
  return { ok: true, value: out };
}

export function validateSeo(input: unknown): Result<SiteSettings["seo"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const fav = validateImageUrl(str(o.faviconUrl, 500));
  if (!fav.ok) return { ok: false, error: `Favicon: ${fav.error}` };
  const og = validateImageUrl(str(o.defaultOgImageUrl, 500));
  if (!og.ok) return { ok: false, error: `Default share image: ${og.error}` };
  const googleVerification = str(o.googleVerification, 200).replace(/^content=/, "").replace(/^["']|["']$/g, "");
  if (googleVerification && !/^[A-Za-z0-9_-]{20,100}$/.test(googleVerification)) {
    return { ok: false, error: "The Search Console code is just the letters and numbers after content= in the verification tag." };
  }
  return { ok: true, value: { faviconUrl: fav.url ?? "", defaultOgImageUrl: og.url ?? "", googleVerification } };
}

export function validateFooter(input: unknown): Result<SiteSettings["footer"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const blurb = str(o.blurb, 1000);
  if (blurb.length > 300) return { ok: false, error: "Keep the footer text under 300 characters." };
  const copyrightName = str(o.copyrightName, 200);
  if (!copyrightName) return { ok: false, error: "Enter the name for the © line." };
  if (copyrightName.length > 80) return { ok: false, error: "Keep the © name under 80 characters." };
  const links: string[] = [];
  for (const [key, label] of [["privacyUrl", "Privacy policy"], ["termsUrl", "Terms"]] as const) {
    const t = str(o[key], 500);
    if (!t) {
      links.push("");
      continue;
    }
    const checked = validateDestination(t);
    if (!checked.ok) return { ok: false, error: `${label}: ${checked.error}` };
    links.push(checked.url);
  }
  return { ok: true, value: { blurb, copyrightName, privacyUrl: links[0], termsUrl: links[1] } };
}

/** Rows from the table -> full settings, falling back to defaults for anything missing or malformed. */
export function mergeSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const by = new Map(rows.map((r) => [r.key, r.value]));
  const pick = <K extends SectionName>(name: K, validate: (v: unknown) => Result<SiteSettings[K]>): SiteSettings[K] => {
    const raw = by.get(SECTION_KEYS[name]);
    if (raw === undefined) return DEFAULT_SETTINGS[name];
    const checked = validate(raw);
    return checked.ok ? checked.value : DEFAULT_SETTINGS[name];
  };
  return {
    identity: pick("identity", validateIdentity),
    contact: pick("contact", validateContact),
    social: pick("social", validateSocial),
    seo: pick("seo", validateSeo),
    footer: pick("footer", validateFooter),
  };
}
