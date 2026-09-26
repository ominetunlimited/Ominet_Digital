// Pulls a cover image out of an uploaded book file — only ever an image the
// file genuinely contains (or, for PDF, a render of its real first page).
// When nothing usable is found it says so plainly; it never invents a cover.

import JSZip from "jszip";
import type { BookFormat } from "./analyze";

export type CoverResult =
  | { ok: true; bytes: Uint8Array; mime: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; source: string }
  | { ok: false; reason: string };

const MAX_COVER_BYTES = 15 * 1024 * 1024;

const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];

export function imageMime(b: Uint8Array): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

function asCover(bytes: Uint8Array, source: string): CoverResult {
  if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) return { ok: false, reason: "The embedded cover image has an unusable size." };
  const mime = imageMime(bytes);
  if (!mime) return { ok: false, reason: "The embedded cover isn't a normal image (JPEG, PNG, GIF or WebP)." };
  return { ok: true, bytes, mime, source };
}

function attr(tagText: string, name: string): string | undefined {
  return tagText.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
}

function resolvePath(baseDir: string, href: string): string {
  const parts = (baseDir + decodeURIComponent(href.split("#")[0])).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}

async function epubCover(bytes: Uint8Array): Promise<CoverResult> {
  const zip = await JSZip.loadAsync(bytes);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/i)?.[1];
  const opf = opfPath ? await zip.file(opfPath)?.async("string") : undefined;
  if (!opfPath || !opf) return { ok: false, reason: "This EPUB has no readable package file, so no cover could be found." };
  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const items = [...opf.matchAll(/<item\b[^>]*>/gi)].map((m) => m[0]);
  let href = items.find((i) => /properties="[^"]*\bcover-image\b[^"]*"/i.test(i)) && attr(items.find((i) => /properties="[^"]*\bcover-image\b[^"]*"/i.test(i))!, "href");
  if (!href) {
    const coverId = opf.match(/<meta\b[^>]*name="cover"[^>]*>/i)?.[0] && attr(opf.match(/<meta\b[^>]*name="cover"[^>]*>/i)![0], "content");
    if (coverId) {
      const item = items.find((i) => attr(i, "id") === coverId);
      if (item && /^image\//i.test(attr(item, "media-type") ?? "")) href = attr(item, "href");
    }
  }
  if (!href) return { ok: false, reason: "This EPUB doesn't declare a cover image." };

  const entry = zip.file(resolvePath(baseDir, href));
  if (!entry) return { ok: false, reason: "This EPUB names a cover image that isn't in the file." };
  return asCover(await entry.async("uint8array"), "Embedded EPUB cover");
}

function mobiCover(bytes: Uint8Array): CoverResult {
  const numRecords = u16(bytes, 76);
  const rec0 = u32(bytes, 78);
  if (numRecords < 2 || rec0 + 132 > bytes.length) return { ok: false, reason: "This MOBI file's records couldn't be read." };
  const headerLength = u32(bytes, rec0 + 20);
  const firstImage = u32(bytes, rec0 + 108);
  const exthStart = rec0 + 16 + headerLength;
  if (!(u32(bytes, rec0 + 128) & 0x40) || String.fromCharCode(...bytes.subarray(exthStart, exthStart + 4)) !== "EXTH") {
    return { ok: false, reason: "This MOBI file carries no cover information." };
  }
  let coverOffset: number | null = null;
  const count = u32(bytes, exthStart + 8);
  let p = exthStart + 12;
  for (let i = 0; i < count && p + 8 <= bytes.length; i++) {
    const type = u32(bytes, p);
    const len = u32(bytes, p + 4);
    if (len < 8 || p + len > bytes.length) break;
    if (type === 201 && len >= 12) coverOffset = u32(bytes, p + 8);
    p += len;
  }
  if (coverOffset === null || firstImage === 0xffffffff) return { ok: false, reason: "This MOBI file doesn't declare a cover image." };

  const index = firstImage + coverOffset;
  if (index >= numRecords) return { ok: false, reason: "This MOBI file's cover record is missing." };
  const start = u32(bytes, 78 + index * 8);
  const end = index + 1 < numRecords ? u32(bytes, 78 + (index + 1) * 8) : bytes.length;
  if (start >= end || end > bytes.length) return { ok: false, reason: "This MOBI file's cover record is damaged." };
  return asCover(bytes.slice(start, end), "Embedded MOBI cover");
}

async function docxCover(bytes: Uint8Array): Promise<CoverResult> {
  const zip = await JSZip.loadAsync(bytes);
  for (const name of ["docProps/thumbnail.jpeg", "docProps/thumbnail.jpg", "docProps/thumbnail.png"]) {
    const entry = zip.file(name);
    if (entry) return asCover(await entry.async("uint8array"), "Word's saved preview thumbnail");
  }
  return { ok: false, reason: "This Word document has no saved preview image. Word can't be rendered here, so upload a cover instead." };
}

export async function extractCover(bytes: Uint8Array, format: BookFormat): Promise<CoverResult> {
  try {
    switch (format) {
      case "epub":
        return await epubCover(bytes);
      case "mobi":
        return mobiCover(bytes);
      case "docx":
        return await docxCover(bytes);
      case "pdf": {
        const { renderPdfFirstPage } = await import("./pdf-cover");
        return await renderPdfFirstPage(bytes);
      }
    }
  } catch {
    return { ok: false, reason: "A cover couldn't be extracted from this file." };
  }
}
