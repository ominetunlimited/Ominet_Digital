/**
 * Turns a pasted link into something safe to show. Only a short allow-list of hosts is ever framed
 * (the same list the site's Content Security Policy permits); anything else becomes a plain link.
 */
export type Embed =
  | { type: "iframe"; src: string; title: string }
  | { type: "video"; src: string }
  | { type: "image"; src: string }
  | { type: "link"; href: string };

export const MEDIA_KINDS = [
  { value: "image", label: "Photo or image" },
  { value: "video", label: "Video (YouTube, Vimeo or a video file)" },
  { value: "slides", label: "Slides (Google Slides, Canva or PDF)" },
  { value: "pdf", label: "PDF document" },
  { value: "link", label: "Other link" },
] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number]["value"];

export function isHttps(url: string): boolean {
  try { return new URL(url).protocol === "https:"; } catch { return false; }
}

export function toEmbed(kind: string, rawUrl: string): Embed {
  const url = rawUrl.trim();
  if (!isHttps(url)) return { type: "link", href: "#" };
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");

  if (kind === "image") return { type: "image", src: url };

  if (kind === "video") {
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      let id = "";
      if (host === "youtu.be") id = u.pathname.slice(1);
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? "";
      else id = u.searchParams.get("v") ?? "";
      if (/^[\w-]{6,20}$/.test(id)) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, title: "Video" };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
      if (/^\d{5,12}$/.test(id)) return { type: "iframe", src: `https://player.vimeo.com/video/${id}`, title: "Video" };
    }
    if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { type: "video", src: url };
    return { type: "link", href: url };
  }

  if (kind === "slides") {
    if (host === "docs.google.com" && u.pathname.startsWith("/presentation/d/")) {
      const id = u.pathname.split("/")[3];
      if (id && /^[\w-]+$/.test(id)) return { type: "iframe", src: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`, title: "Slides" };
    }
    if (host === "canva.com" && u.pathname.includes("/design/")) {
      const clean = `https://www.canva.com${u.pathname.replace(/\/(view|edit|watch)$/, "")}/view?embed`;
      return { type: "iframe", src: clean, title: "Slides" };
    }
    return { type: "link", href: url };
  }

  return { type: "link", href: url };
}
