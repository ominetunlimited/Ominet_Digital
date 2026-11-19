// Rich text helpers shared by the admin editor (client) and every place that
// saves or renders long-form content (server). No DOM required.
//
// Storage format: a sanitised HTML string, so it works with the existing
// article/privacy columns and renders anywhere. Older content saved as plain
// text (blank-line paragraphs, "- " bullets) is converted on read by
// toRichHtml() but is NEVER rewritten until an editor saves it.

import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a", "hr"];
const ALIGN = ["left", "center", "right", "justify"];

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const looksLikeHtml = (s: string) => /<\/?(p|br|h[1-6]|ul|ol|li|strong|em|b|i|u|a|blockquote|div|span|hr)\b[^>]*>/i.test(s);

/** Plain text from older records becomes tidy HTML; HTML passes through. */
export function toRichHtml(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (looksLikeHtml(v)) return v;
  const blocks = v.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const bullet = (l: string) => /^[-*•]\s+/.test(l);
      const numbered = (l: string) => /^\d+[.)]\s+/.test(l);
      let html = "";
      let i = 0;
      while (i < lines.length) {
        if (bullet(lines[i])) {
          const items: string[] = [];
          while (i < lines.length && bullet(lines[i])) items.push(lines[i++].replace(/^[-*•]\s+/, ""));
          html += `<ul>${items.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
        } else if (numbered(lines[i])) {
          const items: string[] = [];
          while (i < lines.length && numbered(lines[i])) items.push(lines[i++].replace(/^\d+[.)]\s+/, ""));
          html += `<ol>${items.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol>`;
        } else {
          const para: string[] = [];
          while (i < lines.length && !bullet(lines[i]) && !numbered(lines[i])) para.push(lines[i++]);
          html += `<p>${para.map(escapeHtml).join("<br>")}</p>`;
        }
      }
      return html;
    })
    .join("");
}

/**
 * Allow-list sanitiser: keeps semantic formatting, drops scripts, event
 * handlers, styles other than text-align, classes, iframes and unsafe URLs.
 * Also removes empty paragraphs so pasted documents don't leave big gaps.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  const input = toRichHtml(html);
  if (!input) return "";
  const clean = sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"], p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], li: ["style"] },
    allowedStyles: { "*": { "text-align": [new RegExp(`^(${ALIGN.join("|")})$`)] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      b: "strong",
      i: "em",
      a: (tag, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return { tagName: "a", attribs: { href: attribs.href ?? "", ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) } };
      },
    },
    exclusiveFilter: (frame) => ["p", "h1", "h2", "h3", "h4", "li", "blockquote"].includes(frame.tag) && !frame.text.trim(),
  });
  return clean.replace(/(<p>(\s|&nbsp;)*<\/p>)+/g, "").trim();
}

/** Visible text only, for meta descriptions, excerpts and JSON-LD. */
export function richToPlainText(html: string | null | undefined): string {
  const spaced = toRichHtml(html).replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ");
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function isRichEmpty(html: string | null | undefined): boolean {
  return richToPlainText(html) === "";
}

/** Splits sanitised HTML into its top-level blocks (used where a layout places the first blocks differently). */
export function splitRichBlocks(html: string | null | undefined): string[] {
  const clean = sanitizeRichHtml(html);
  const blocks: string[] = [];
  const re = /<(\/?)([a-z0-9]+)[^>]*>/gi;
  const VOID = new Set(["br", "hr"]);
  let depth = 0;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (VOID.has(tag)) {
      if (depth === 0) { blocks.push(clean.slice(start, re.lastIndex)); start = re.lastIndex; }
      continue;
    }
    if (!closing) depth++;
    else {
      depth--;
      if (depth === 0) { blocks.push(clean.slice(start, re.lastIndex)); start = re.lastIndex; }
    }
  }
  return blocks.filter((b) => b.trim());
}
