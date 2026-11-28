// Shared structured-data (JSON-LD) building blocks. A stable @id for the
// Person and Organization entities is repeated — with the SAME id and the
// same core facts — on every page that needs them, rather than a thin
// cross-page reference: crawlers generally evaluate one document at a time,
// so a page whose only Person data is `{"@id": "..."}` pointing at a DIFFERENT
// page's markup is a dangling reference there. Full, duplicated-but-consistent
// nodes are what tooling (and Google's own guidance) actually expects.
// Nothing here invents a fact — every field comes from data already in the CMS.

import { SITE_URL } from "./seo";
import { getSiteSettings } from "./site-settings";
import { getResearchProfiles } from "./research";
import { OFFICIAL_EMAIL, OFFICIAL_WHATSAPP_NUMBER } from "./links";

export const PERSON_ID = `${SITE_URL}/#person`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const DEFAULT_JOB_TITLE = "Writer, Researcher, Media & Communications Specialist";

/** The Person entity for Omini Nfawa, with sameAs drawn from the site's own social + research-profile links. */
export async function getPersonSchema(name = "Omini Nfawa", jobTitle = DEFAULT_JOB_TITLE) {
  const [{ social }, research] = await Promise.all([getSiteSettings(), getResearchProfiles()]);
  const sameAs = [...social.filter((s) => s.enabled && s.url).map((s) => s.url), ...research.map((r) => r.url)];
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name,
    // /about is the company page; the founder's own page is /founder.
    url: `${SITE_URL}/founder`,
    jobTitle,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** The company's own logo (480 x 465 PNG), used when no logo is set in Site settings. Absolute, as Google requires. */
const DEFAULT_LOGO_URL = `${SITE_URL}/images/ominet-digital-logo.png`;

/**
 * The Organization entity for the site itself. sameAs lists the company accounts saved in Site settings.
 * LinkedIn is left out on purpose: the saved address is a personal /in/ profile, which belongs to the
 * Person entity, not the company.
 */
export async function getOrganizationSchema(name: string, logoUrl?: string) {
  const { social } = await getSiteSettings(); // cached per request, so no extra query
  const sameAs = social.filter((s) => s.enabled && s.url && s.platform !== "linkedin").map((s) => s.url);
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name,
    url: SITE_URL,
    logo: logoUrl || DEFAULT_LOGO_URL,
    founder: { "@id": PERSON_ID },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: OFFICIAL_EMAIL,
        telephone: `+${OFFICIAL_WHATSAPP_NUMBER}`,
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${SITE_URL}${item.path}` })),
  };
}

export function collectionPageSchema(name: string, path: string, itemNames: string[]) {
  return {
    "@type": "CollectionPage",
    name,
    url: `${SITE_URL}${path}`,
    ...(itemNames.length > 0
      ? { mainEntity: { "@type": "ItemList", itemListElement: itemNames.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n })) } }
      : {}),
  };
}

/** Wraps any number of JSON-LD nodes as a single connected @graph. */
export function jsonLdGraph(nodes: unknown[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
