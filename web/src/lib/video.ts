"use server";

// Detects the platform behind a pasted video URL and, where the platform
// offers a public no-auth way to get one (oEmbed), fetches its thumbnail.
// YouTube, TikTok and Vimeo all have public oEmbed endpoints. Facebook's
// oEmbed requires an app access token we don't have, so a Facebook link
// gets no auto-thumbnail — the admin uploads or pastes one instead. This
// never fakes a thumbnail; a platform either really provides one or it
// doesn't.

export type VideoPlatform = "youtube" | "tiktok" | "vimeo" | "facebook" | "other";

function detectVideoPlatform(url: string): VideoPlatform {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") return "youtube";
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (host === "vimeo.com") return "vimeo";
    if (host === "facebook.com" || host === "fb.watch" || host.endsWith(".facebook.com")) return "facebook";
    return "other";
  } catch {
    return "other";
  }
}

const OEMBED_ENDPOINTS: Partial<Record<VideoPlatform, (url: string) => string>> = {
  youtube: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  tiktok: (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  vimeo: (url) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
};

export type ThumbnailResult = { ok: true; platform: VideoPlatform; thumbnailUrl: string; title?: string } | { ok: false; platform: VideoPlatform; error: string };

/** Server action: fetch a video's public thumbnail via oEmbed, when the platform offers one. */
export async function fetchVideoThumbnail(url: string): Promise<ThumbnailResult> {
  const platform = detectVideoPlatform(url);
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) {
    return {
      ok: false,
      platform,
      error:
        platform === "facebook"
          ? "Facebook doesn't offer a public thumbnail lookup — upload one or paste a thumbnail URL."
          : "This platform isn't recognized — upload a thumbnail or paste one manually.",
    };
  }
  try {
    const res = await fetch(endpoint(url));
    if (!res.ok) return { ok: false, platform, error: `Couldn't fetch oEmbed data (${res.status}).` };
    const json = await res.json();
    if (!json.thumbnail_url) return { ok: false, platform, error: "No thumbnail returned for that link." };
    return { ok: true, platform, thumbnailUrl: json.thumbnail_url, title: json.title };
  } catch {
    return { ok: false, platform, error: "Couldn't reach that platform to fetch a thumbnail." };
  }
}
