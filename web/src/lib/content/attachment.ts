// Validates an article's optional downloadable attachment by its REAL
// CONTENTS — never by filename — the same discipline as book files
// (src/lib/books/analyze.ts), just without the page-count/cover analysis an
// article doesn't need. Self-contained so it can be tested in isolation.

import JSZip from "jszip";
import { detectKind } from "@/lib/books/analyze";

export type AttachmentFormat = "pdf" | "docx";
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_EXTENSIONS: Record<string, AttachmentFormat> = { pdf: "pdf", docx: "docx" };

export type AttachmentCheck = { ok: true; sizeBytes: number } | { ok: false; error: string };

async function looksLikeDocx(bytes: Uint8Array): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    return Boolean(zip.file("[Content_Types].xml") && zip.file("word/document.xml"));
  } catch {
    return false;
  }
}

export async function validateAttachment(bytes: Uint8Array, declared: AttachmentFormat): Promise<AttachmentCheck> {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_ATTACHMENT_BYTES) return { ok: false, error: "That file is larger than the 25 MB limit." };

  const kind = detectKind(bytes);
  if (declared === "pdf") {
    if (kind !== "pdf") return { ok: false, error: "This doesn't look like a real PDF file." };
  } else {
    if (kind !== "zip" || !(await looksLikeDocx(bytes))) return { ok: false, error: "This doesn't look like a real Word (.docx) document." };
  }
  return { ok: true, sizeBytes: bytes.length };
}
