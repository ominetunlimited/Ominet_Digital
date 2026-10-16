// Site settings: shape, defaults and validation. Dependency-free so it can be
// unit-tested. Everything stored here is PUBLIC (the site_settings table is
// publicly readable) — credentials and tokens never belong in it.

import { validateDestination, validateImageUrl } from "./ad-validate";

export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin";
export type SocialLink = { platform: SocialPlatform; label: string; url: string; enabled: boolean };

export type SiteSettings = {
  identity: { siteName: string; description: string; logoUrl: string };
  contact: { supportEmail: string; bookingEmail: string; phone: string; whatsapp: string };
  social: SocialLink[];
  seo: { faviconUrl: string; defaultOgImageUrl: string; googleVerification: string };
  footer: { blurb: string; copyrightName: string; privacyUrl: string; termsUrl: string };
  homepage: { heroImageUrl: string; heroHeading: string; heroSubheading: string; showRecentWriting: boolean };
  about: { photoUrl: string; tagline: string; intro: string; bio: string };
  ecosystem: { profileVisible: boolean; profileMessage: string; cortexaVisible: boolean; cortexaMessage: string };
  comments: { requireSignIn: boolean };
  legal: { privacyHtml: string };
};

export type SectionName = keyof SiteSettings;
export const SECTION_KEYS: Record<SectionName, string> = {
  identity: "site_identity",
  contact: "site_contact",
  social: "site_social",
  seo: "site_seo",
  footer: "site_footer",
  homepage: "site_homepage",
  about: "site_about",
  ecosystem: "site_ecosystem",
  comments: "site_comments",
  legal: "site_legal",
};

const DESCRIPTION = "A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.";

// What the About page has always said — kept as the default here so nothing
// on the live page changes until an admin edits it in Site settings.
const DEFAULT_BIO = [
  "Omini Nfawa is a Nigerian writer, researcher and media and communications specialist whose work moves between literature, research, storytelling and the everyday business of trying to make sense of Nigeria.",
  "He studied English and Literary Studies, which probably explains why he has spent a considerable amount of time arguing with sentences, stories and ideas. Writing came naturally. Media came with it. Technology arrived later and, rather than being politely ignored, became an adventure of its own.",
  "His work lives mainly in three places: writing, media, and digital innovation.",
  "As a writer, Omini works across fiction, essays, literary criticism, research and social commentary. His interests often circle around power, identity, inequality, childhood, culture, society and the strange ways ordinary people find themselves inside much bigger stories.",
  "His published and completed works include an analysis of Florence Oketona's Ashes in the Times, The Dual Edge of Religion, and An Analysis of the Representation of Violence Against the Male Child in African Fiction. The latter research also helped inspire his novel, A Child's Cry in the Savannah.",
  "He is also working on a growing body of social and political writing, including Our Politicians Have Gone Mad Again, Things Are Getting Out of Hand, and The Slow Funeral of Nigeria's Institutions, among other works.",
  "Media is another part of the same instinct. Omini works with video, photography, documentary storytelling, visual communication and creative production. For him, a camera is not simply a piece of equipment. It is another way of asking questions, noticing things and occasionally catching something that words would have missed.",
  "Technology is the newer adventure. Through Ominet Digital, he explores digital publishing, websites, software, creative technology and new ways of organising ideas and professional identity. PROFILE, for example, grew from an interest in how people can build a professional identity from the work they actually do, rather than endlessly rewriting the same CV.",
  "Ominet Digital is where these interests meet: writing, research, media, publishing, technology and creative work.",
  "There is no neat formula behind all of it. Omini is interested in ideas, but also in making things. He can spend hours thinking about a literary theory and then get distracted by a website that needs fixing. He likes books, cameras, good arguments, useful technology and stories that leave something behind after the last page.",
  "There is always a story behind the story. And this is where he keeps some of them.",
].join("\n\n");

/** What the site showed before settings existed — nothing changes until an admin edits something. */
export const DEFAULT_SETTINGS: SiteSettings = {
  identity: { siteName: "Ominet Digital", description: DESCRIPTION, logoUrl: "" },
  contact: { supportEmail: "info@ominetdigital.com.ng", bookingEmail: "ominetmedia@gmail.com", phone: "", whatsapp: "" },
  social: [
    { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/OminetUnlimited", enabled: true },
    { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/ominetunlimited/", enabled: true },
    { platform: "x", label: "X", url: "https://x.com/ominetmedia", enabled: true },
    { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/ominet", enabled: true },
  ],
  seo: { faviconUrl: "", defaultOgImageUrl: "", googleVerification: "" },
  footer: { blurb: DESCRIPTION, copyrightName: "Ominet Digital", privacyUrl: "/privacy", termsUrl: "" },
  homepage: {
    heroImageUrl: "",
    heroHeading: "Writer. Researcher.\nMedia & Communications Specialist.",
    heroSubheading: DESCRIPTION,
    showRecentWriting: true,
  },
  about: {
    photoUrl: "",
    tagline: "Writer · Researcher · Media & Communications Specialist",
    intro: "Creative troublemaker, occasionally.",
    bio: DEFAULT_BIO,
  },
  // Both start hidden (unlike every other section's defaults, which
  // preserve what the site already showed) — PROFILE and Cortexa Office are
  // still under development and were asked to be protected immediately.
  // Flip visible on when each is actually ready to be shown publicly.
  ecosystem: {
    profileVisible: false,
    profileMessage: "PROFILE is being built. Check back soon.",
    cortexaVisible: false,
    cortexaMessage: "Cortexa Office is being built. Check back soon.",
  },
  // Matches the behavior before this setting existed — sign-in was required.
  comments: { requireSignIn: true },
  // Empty = /privacy shows its own built-in text (what's live today).
  // Once an admin saves something here, that replaces it entirely.
  legal: { privacyHtml: "" },
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
  const logo = validateImageUrl(str(o.logoUrl, 500));
  if (!logo.ok) return { ok: false, error: `Logo: ${logo.error}` };
  return { ok: true, value: { siteName, description, logoUrl: logo.url ?? "" } };
}

export function validateContact(input: unknown): Result<SiteSettings["contact"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const supportEmail = str(o.supportEmail, 200);
  const bookingEmail = str(o.bookingEmail, 200);
  const phone = str(o.phone, 60);
  const whatsapp = str(o.whatsapp, 60);
  if (!EMAIL_RE.test(supportEmail)) return { ok: false, error: "Enter a valid support email." };
  if (!EMAIL_RE.test(bookingEmail)) return { ok: false, error: "Enter a valid booking email." };
  if (phone && !/^[+\d][\d\s().-]{4,38}$/.test(phone)) return { ok: false, error: "That phone number doesn't look right." };
  if (whatsapp && !/^[+\d][\d\s().-]{4,38}$/.test(whatsapp)) return { ok: false, error: "That WhatsApp number doesn't look right — include the country code, e.g. +234…" };
  return { ok: true, value: { supportEmail, bookingEmail, phone, whatsapp } };
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

export function validateHomepage(input: unknown): Result<SiteSettings["homepage"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const heroImg = validateImageUrl(str(o.heroImageUrl, 500));
  if (!heroImg.ok) return { ok: false, error: `Hero image: ${heroImg.error}` };
  const heroHeading = str(o.heroHeading, 200);
  if (!heroHeading) return { ok: false, error: "Enter the hero heading." };
  const heroSubheading = str(o.heroSubheading, 400);
  return {
    ok: true,
    value: { heroImageUrl: heroImg.url ?? "", heroHeading, heroSubheading, showRecentWriting: Boolean(o.showRecentWriting) },
  };
}

export function validateAbout(input: unknown): Result<SiteSettings["about"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  const photo = validateImageUrl(str(o.photoUrl, 500));
  if (!photo.ok) return { ok: false, error: `Photo: ${photo.error}` };
  const tagline = str(o.tagline, 200);
  const intro = str(o.intro, 300);
  const bio = str(o.bio, 8000);
  if (!bio) return { ok: false, error: "The bio can't be empty." };
  return { ok: true, value: { photoUrl: photo.url ?? "", tagline, intro, bio } };
}

export function validateEcosystem(input: unknown): Result<SiteSettings["ecosystem"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    value: {
      profileVisible: Boolean(o.profileVisible),
      profileMessage: str(o.profileMessage, 300) || DEFAULT_SETTINGS.ecosystem.profileMessage,
      cortexaVisible: Boolean(o.cortexaVisible),
      cortexaMessage: str(o.cortexaMessage, 300) || DEFAULT_SETTINGS.ecosystem.cortexaMessage,
    },
  };
}

export function validateComments(input: unknown): Result<SiteSettings["comments"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  return { ok: true, value: { requireSignIn: Boolean(o.requireSignIn) } };
}

export function validateLegal(input: unknown): Result<SiteSettings["legal"]> {
  const o = (input ?? {}) as Record<string, unknown>;
  return { ok: true, value: { privacyHtml: str(o.privacyHtml, 50000) } };
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
    homepage: pick("homepage", validateHomepage),
    about: pick("about", validateAbout),
    ecosystem: pick("ecosystem", validateEcosystem),
    comments: pick("comments", validateComments),
    legal: pick("legal", validateLegal),
  };
}
