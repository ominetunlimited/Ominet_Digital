export type ResearchPlatform = "google_scholar" | "researchgate" | "academia" | "orcid" | "other";

export const PLATFORMS: { value: ResearchPlatform; label: string; example: string }[] = [
  { value: "google_scholar", label: "Google Scholar", example: "https://scholar.google.com/citations?user=…" },
  { value: "researchgate", label: "ResearchGate", example: "https://www.researchgate.net/profile/…" },
  { value: "academia", label: "Academia.edu", example: "https://yourinstitution.academia.edu/YourName" },
  { value: "orcid", label: "ORCID", example: "https://orcid.org/0000-0000-0000-0000" },
  { value: "other", label: "Other academic profile", example: "https://…" },
];

const ORCID_ID = /^\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/**
 * A link only counts if it really points at the platform it claims to be —
 * this stops a typo (or a pasted phishing URL) from being published under a
 * trusted-looking "Google Scholar" label. Returns the cleaned https URL.
 */
export function validateProfileUrl(platform: ResearchPlatform, raw: string): { ok: true; url: string } | { ok: false; error: string } {
  let text = raw.trim();
  if (!text) return { ok: false, error: "Paste the profile link." };
  if (text.length > 300) return { ok: false, error: "That link is too long." };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) text = `https://${text}`;

  let u: URL;
  try {
    u = new URL(text);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  if (u.protocol !== "https:") return { ok: false, error: "The link must start with https://" };
  if (u.username || u.password) return { ok: false, error: "The link can't contain a username or password." };

  const host = u.hostname.toLowerCase();
  const path = u.pathname.replace(/\/+$/, "");
  switch (platform) {
    case "google_scholar":
      if (host !== "scholar.google.com") return { ok: false, error: "A Google Scholar link starts with https://scholar.google.com/" };
      if (!/^\/citations/.test(path) || !u.searchParams.get("user")) return { ok: false, error: "Use your profile page link (it contains /citations?user=…)." };
      break;
    case "researchgate":
      if (host !== "researchgate.net" && host !== "www.researchgate.net") return { ok: false, error: "A ResearchGate link starts with https://www.researchgate.net/" };
      if (!/^\/profile\/.+/.test(path)) return { ok: false, error: "Use your profile page link (https://www.researchgate.net/profile/…)." };
      break;
    case "academia":
      if (host !== "academia.edu" && !host.endsWith(".academia.edu")) return { ok: false, error: "An Academia.edu link ends in academia.edu" };
      if (path.length < 2) return { ok: false, error: "Use your profile page link, not the Academia.edu home page." };
      break;
    case "orcid":
      if (host !== "orcid.org" && host !== "www.orcid.org") return { ok: false, error: "An ORCID link starts with https://orcid.org/" };
      if (!ORCID_ID.test(path)) return { ok: false, error: "An ORCID link ends with your iD, like 0000-0002-1825-0097." };
      break;
    case "other":
      if (!host.includes(".")) return { ok: false, error: "That doesn't look like a real website address." };
      break;
  }
  return { ok: true, url: u.toString() };
}

