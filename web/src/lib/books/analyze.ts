// Inspects an uploaded book file by its REAL CONTENTS — never by its filename
// or the browser-reported type — and reports what it can genuinely determine.
// A page count is only ever returned when the file itself says so; otherwise
// it's null with a note, so the admin is asked instead of shown an invented
// number. Self-contained on purpose (no app imports) so it can be tested in
// isolation with real sample files.

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

export type BookFormat = "pdf" | "epub" | "mobi" | "docx";

export const MAX_BOOK_BYTES = 70 * 1024 * 1024;
export const ALLOWED_EXTENSIONS: Record<string, BookFormat> = { pdf: "pdf", epub: "epub", mobi: "mobi", docx: "docx" };

export type PageSource = "pdf" | "docx" | "epub";

export type BookAnalysis =
  | {
      ok: true;
      format: BookFormat;
      sizeBytes: number;
      title?: string;
      author?: string;
      publisher?: string;
      isbn?: string;
      language?: string;
      pageCount: number | null;
      pageSource: PageSource | null;
      pageNote: string;
      /** true = an embedded cover image exists; false = none; null = can't say from metadata (PDF/DOCX use first-page rendering). */
      hasEmbeddedCover: boolean | null;
      notes: string[];
    }
  | { ok: false; error: string };

const MAX_XML_BYTES = 3 * 1024 * 1024; // metadata files are tiny; anything bigger is not metadata
const MAX_UNPACKED_BYTES = 1.5 * 1024 * 1024 * 1024; // zip-bomb ceiling for the whole archive
const MAX_ZIP_ENTRIES = 20000;

function startsWith(bytes: Uint8Array, ascii: string, offset = 0): boolean {
  if (bytes.length < offset + ascii.length) return false;
  for (let i = 0; i < ascii.length; i++) if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  return true;
}

export function detectKind(bytes: Uint8Array): "pdf" | "zip" | "mobi" | null {
  const head = bytes.subarray(0, 1024);
  for (let i = 0; i + 5 <= head.length; i++) if (startsWith(head, "%PDF-", i)) return "pdf";
  if (bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "zip";
  if (startsWith(bytes, "BOOKMOBI", 60)) return "mobi";
  return null;
}

function decodeXmlText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(xml: string, name: string): string | undefined {
  const m = xml.match(new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "i"));
  const v = m ? decodeXmlText(m[1]) : "";
  return v || undefined;
}

async function readText(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
  if (size !== undefined && size > MAX_XML_BYTES) return null;
  return entry.async("string");
}

function pickIsbn(identifiers: string[]): string | undefined {
  for (const raw of identifiers) {
    const digits = raw.replace(/[^0-9Xx]/g, "");
    if (digits.length === 13 || digits.length === 10) return digits.toUpperCase();
  }
  return undefined;
}

async function openZip(bytes: Uint8Array): Promise<{ zip: JSZip } | { error: string }> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return { error: "This file is damaged or isn't a valid archive." };
  }
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) return { error: "This archive contains an unreasonable number of files." };
  let unpacked = 0;
  for (const e of entries) unpacked += (e as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  if (unpacked > MAX_UNPACKED_BYTES) return { error: "This file unpacks to an unreasonable size and was rejected." };
  return { zip };
}

async function analyzePdf(bytes: Uint8Array): Promise<BookAnalysis> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
  } catch {
    return { ok: false, error: "This PDF is damaged or couldn't be read." };
  }
  const count = doc.getPageCount();
  const notes: string[] = [];
  if (doc.isEncrypted) notes.push("This PDF is encrypted; the page count could still be read.");
  return {
    ok: true,
    format: "pdf",
    sizeBytes: bytes.length,
    title: doc.getTitle() || undefined,
    author: doc.getAuthor() || undefined,
    publisher: undefined,
    pageCount: count > 0 ? count : null,
    pageSource: count > 0 ? "pdf" : null,
    pageNote: count > 0 ? "Counted from the PDF itself." : "The PDF reports no pages.",
    hasEmbeddedCover: null,
    notes,
  };
}

async function analyzeDocx(bytes: Uint8Array): Promise<BookAnalysis> {
  const opened = await openZip(bytes);
  if ("error" in opened) return { ok: false, error: opened.error };
  const { zip } = opened;
  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
    return { ok: false, error: "This isn't a real Word (.docx) document." };
  }
  const app = (await readText(zip, "docProps/app.xml")) ?? "";
  const core = (await readText(zip, "docProps/core.xml")) ?? "";
  const pagesRaw = tag(app, "Pages");
  const pages = pagesRaw && /^\d+$/.test(pagesRaw) ? Number(pagesRaw) : 0;
  return {
    ok: true,
    format: "docx",
    sizeBytes: bytes.length,
    title: tag(core, "title"),
    author: tag(core, "creator"),
    publisher: undefined,
    pageCount: pages > 0 ? pages : null,
    pageSource: pages > 0 ? "docx" : null,
    pageNote:
      pages > 0
        ? "The page count Word recorded when the file was last saved. Another program may lay the pages out differently."
        : "This document doesn't record a page count — please enter it.",
    hasEmbeddedCover: null,
    notes: [],
  };
}

async function analyzeEpub(bytes: Uint8Array): Promise<BookAnalysis> {
  const opened = await openZip(bytes);
  if ("error" in opened) return { ok: false, error: opened.error };
  const { zip } = opened;

  const mimetype = ((await readText(zip, "mimetype")) ?? "").trim();
  const container = await readText(zip, "META-INF/container.xml");
  if (mimetype !== "application/epub+zip" && !container) return { ok: false, error: "This isn't a real EPUB book." };
  if (!container) return { ok: false, error: "This EPUB is missing its container description." };

  const opfPath = container.match(/full-path="([^"]+)"/i)?.[1];
  const opf = opfPath ? await readText(zip, opfPath) : null;
  if (!opfPath || !opf) return { ok: false, error: "This EPUB is missing its package file." };

  const identifiers = [...opf.matchAll(/<(?:[\w-]+:)?identifier(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?identifier>/gi)].map((m) => decodeXmlText(m[1]));
  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const hasCover = /properties="[^"]*cover-image[^"]*"/i.test(opf) || /<meta[^>]+name="cover"/i.test(opf);

  // Print-page markers: EPUB 3 nav page-list, or EPUB 2 NCX pageList.
  let pageCount = 0;
  const navHref = opf.match(/<item[^>]+properties="[^"]*\bnav\b[^"]*"[^>]*>/i)?.[0]?.match(/href="([^"]+)"/i)?.[1];
  if (navHref) {
    const nav = await readText(zip, baseDir + decodeURIComponent(navHref));
    const list = nav?.match(/<nav[^>]+epub:type="page-list"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
    if (list) pageCount = (list.match(/<li[\s>]/gi) ?? []).length;
  }
  if (!pageCount) {
    const ncxHref = opf.match(/<item[^>]+media-type="application\/x-dtbncx\+xml"[^>]*>/i)?.[0]?.match(/href="([^"]+)"/i)?.[1];
    if (ncxHref) {
      const ncx = await readText(zip, baseDir + decodeURIComponent(ncxHref));
      const list = ncx?.match(/<pageList[\s>][\s\S]*?<\/pageList>/i)?.[0];
      if (list) pageCount = (list.match(/<pageTarget[\s>]/gi) ?? []).length;
    }
  }

  return {
    ok: true,
    format: "epub",
    sizeBytes: bytes.length,
    title: tag(opf, "title"),
    author: tag(opf, "creator"),
    publisher: tag(opf, "publisher"),
    isbn: pickIsbn(identifiers),
    language: tag(opf, "language"),
    pageCount: pageCount > 0 ? pageCount : null,
    pageSource: pageCount > 0 ? "epub" : null,
    pageNote:
      pageCount > 0
        ? "The number of print-page markers the book itself contains; it can differ from a printed edition's total."
        : "An EPUB reflows to each reader's screen, so it has no fixed page count. Enter one if you want it shown, or leave it blank.",
    hasEmbeddedCover: hasCover,
    notes: [],
  };
}

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function analyzeMobi(bytes: Uint8Array): BookAnalysis {
  try {
    const numRecords = u16(bytes, 76);
    if (numRecords < 1 || 78 + numRecords * 8 > bytes.length) return { ok: false, error: "This MOBI file's record table is damaged." };
    const rec0 = u32(bytes, 78);
    if (rec0 + 132 > bytes.length) return { ok: false, error: "This MOBI file is truncated." };

    const encryption = u16(bytes, rec0 + 12);
    const textLength = u32(bytes, rec0 + 4);
    const notes: string[] = [];
    if (encryption !== 0) notes.push("This MOBI file is encrypted/DRM-protected.");

    if (!startsWith(bytes, "MOBI", rec0 + 16)) {
      return { ok: false, error: "This looks like an old Palm document, not a MOBI book." };
    }
    const headerLength = u32(bytes, rec0 + 20);
    const encoding = u32(bytes, rec0 + 28);
    const decoder = new TextDecoder(encoding === 65001 ? "utf-8" : "windows-1252");

    let title: string | undefined;
    const nameOffset = u32(bytes, rec0 + 84);
    const nameLength = u32(bytes, rec0 + 88);
    if (nameLength > 0 && nameLength < 2000 && rec0 + nameOffset + nameLength <= bytes.length) {
      title = decoder.decode(bytes.subarray(rec0 + nameOffset, rec0 + nameOffset + nameLength)).trim() || undefined;
    }

    let author: string | undefined;
    let publisher: string | undefined;
    let isbn: string | undefined;
    let language: string | undefined;
    let hasCover = false;

    const exthFlag = u32(bytes, rec0 + 128) & 0x40;
    const exthStart = rec0 + 16 + headerLength;
    if (exthFlag && startsWith(bytes, "EXTH", exthStart)) {
      const count = u32(bytes, exthStart + 8);
      let p = exthStart + 12;
      for (let i = 0; i < count && p + 8 <= bytes.length; i++) {
        const type = u32(bytes, p);
        const len = u32(bytes, p + 4);
        if (len < 8 || p + len > bytes.length) break;
        const data = bytes.subarray(p + 8, p + len);
        const text = () => decoder.decode(data).trim();
        if (type === 100) author = author ?? text();
        else if (type === 101) publisher = text();
        else if (type === 104) isbn = pickIsbn([text()]);
        else if (type === 201) hasCover = true;
        else if (type === 503 && !title) title = text();
        else if (type === 524) language = text();
        p += len;
      }
    }

    return {
      ok: true,
      format: "mobi",
      sizeBytes: bytes.length,
      title: title || undefined,
      author: author || undefined,
      publisher: publisher || undefined,
      isbn,
      language: language || undefined,
      pageCount: null,
      pageSource: null,
      pageNote: `MOBI files don't record pages (about ${textLength.toLocaleString("en-US")} characters of text). Enter a page count if you want one shown.`,
      hasEmbeddedCover: hasCover,
      notes,
    };
  } catch {
    return { ok: false, error: "This MOBI file couldn't be read." };
  }
}

/**
 * `declared` is what the admin said they were uploading (from the file
 * extension). It must agree with what the bytes actually are.
 */
export async function analyzeBookFile(bytes: Uint8Array, declared: BookFormat): Promise<BookAnalysis> {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_BOOK_BYTES) return { ok: false, error: "This file is larger than the 70 MB limit." };

  const kind = detectKind(bytes);
  const mismatch = { ok: false as const, error: `This doesn't look like a real .${declared} file — its contents don't match its type.` };

  try {
    switch (declared) {
      case "pdf":
        return kind === "pdf" ? await analyzePdf(bytes) : mismatch;
      case "mobi":
        return kind === "mobi" ? analyzeMobi(bytes) : mismatch;
      case "epub":
        return kind === "zip" ? await analyzeEpub(bytes) : mismatch;
      case "docx":
        return kind === "zip" ? await analyzeDocx(bytes) : mismatch;
    }
  } catch {
    return { ok: false, error: "This file couldn't be analysed." };
  }
}
