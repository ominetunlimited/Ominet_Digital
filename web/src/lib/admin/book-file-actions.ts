"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeBookFile, ALLOWED_EXTENSIONS, MAX_BOOK_BYTES, type BookFormat } from "@/lib/books/analyze";
import { extractCover } from "@/lib/books/cover";

const BUCKET = "book-files"; // PRIVATE — no public URLs; only staff-issued, expiring links
const PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|epub|mobi|docx)$/;

export type FileDetected = {
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  language?: string;
  pageCount: number | null;
  pageSource: "pdf" | "docx" | "epub" | null;
  pageNote: string;
  hasEmbeddedCover: boolean | null;
  notes: string[];
};

export type BookFileRecord = {
  id: string;
  format: BookFormat;
  originalName: string;
  sizeBytes: number;
  detected: FileDetected;
  createdAt: string;
};

export type UploadTicket = { ok: true; path: string; token: string } | { ok: false; error: string };
export type ConfirmResult = { ok: true; file: BookFileRecord } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };
export type UrlResult = { ok: true; url: string } | { ok: false; error: string };

/** Ask the database (not the browser) whether the caller is staff. */
async function staffCheck(): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStaff();
  return auth.ok ? { ok: true } : { ok: false, error: auth.error };
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Step 1 of an upload. A 70 MB file can't pass through a Server Action, so the
 * browser sends it straight to storage — but only using a one-time link this
 * function issues, and only to staff. The storage path is generated here; the
 * uploader's filename never becomes part of it.
 */
export async function requestBookFileUpload(bookId: string, fileName: string, sizeBytes: number): Promise<UploadTicket> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;

  const format = ALLOWED_EXTENSIONS[extensionOf(fileName)];
  if (!format) return { ok: false, error: "Only PDF, EPUB, MOBI or DOCX files can be uploaded." };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { ok: false, error: "That file is empty." };
  if (sizeBytes > MAX_BOOK_BYTES) return { ok: false, error: "That file is larger than the 70 MB limit." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };
  const { data: book } = await admin.from("books").select("id").eq("id", bookId).maybeSingle();
  if (!book) return { ok: false, error: "Save the book first, then attach files to it." };

  const path = `${bookId}/${randomUUID()}.${format}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Couldn't start the upload. Try again." };
  return { ok: true, path: data.path, token: data.token };
}

/**
 * Step 2, after the browser finished uploading: the server reads the file
 * back out of storage, checks what it REALLY is, and only then records it.
 * Anything that isn't a genuine book of the claimed type is deleted on the spot.
 */
export async function confirmBookFile(bookId: string, path: string, originalName: string): Promise<ConfirmResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;

  // The path must be exactly one this system generated for THIS book.
  if (!PATH_RE.test(path) || !path.startsWith(`${bookId}/`)) return { ok: false, error: "That upload isn't recognised." };
  const format = path.slice(path.lastIndexOf(".") + 1) as BookFormat;

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const reject = async (error: string): Promise<ConfirmResult> => {
    await admin.storage.from(BUCKET).remove([path]);
    return { ok: false, error };
  };

  const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(path);
  if (dlError || !blob) return { ok: false, error: "The upload didn't arrive. Please try again." };
  if (blob.size > MAX_BOOK_BYTES) return reject("That file is larger than the 70 MB limit.");

  const analysis = await analyzeBookFile(new Uint8Array(await blob.arrayBuffer()), format);
  if (!analysis.ok) return reject(analysis.error);

  // One file per format per book: uploading again replaces the old one.
  const { data: existing } = await admin.from("book_files").select("id,storage_path").eq("book_id", bookId).eq("format", format).maybeSingle();
  if (existing) {
    await admin.storage.from(BUCKET).remove([existing.storage_path]);
    await admin.from("book_files").delete().eq("id", existing.id);
  }

  const detected: FileDetected = {
    title: analysis.title,
    author: analysis.author,
    publisher: analysis.publisher,
    isbn: analysis.isbn,
    language: analysis.language,
    pageCount: analysis.pageCount,
    pageSource: analysis.pageSource,
    pageNote: analysis.pageNote,
    hasEmbeddedCover: analysis.hasEmbeddedCover,
    notes: analysis.notes,
  };
  const safeName = originalName.replace(/[\\/\u0000-\u001f]/g, "").slice(0, 200) || `book.${format}`;

  const { data: row, error } = await admin
    .from("book_files")
    .insert({ book_id: bookId, format, storage_path: path, original_name: safeName, size_bytes: analysis.sizeBytes, detected })
    .select("id,created_at")
    .single();
  if (error || !row) return reject("Couldn't save the file record. Try again.");

  revalidatePath(`/admin/books/${bookId}`);
  return {
    ok: true,
    file: { id: row.id, format, originalName: safeName, sizeBytes: analysis.sizeBytes, detected, createdAt: row.created_at },
  };
}

export async function removeBookFile(fileId: string): Promise<PlainResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const { data: file } = await admin.from("book_files").select("id,book_id,storage_path").eq("id", fileId).maybeSingle();
  if (!file) return { ok: false, error: "That file no longer exists." };
  await admin.storage.from(BUCKET).remove([file.storage_path]);
  const { error } = await admin.from("book_files").delete().eq("id", file.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/books/${file.book_id}`);
  return { ok: true };
}

/**
 * Pulls a cover out of an attached file and stores it as a public image. The
 * result is only a suggestion — the admin still presses Save on the book, and
 * can replace it with their own upload at any time.
 */
export async function extractBookFileCover(fileId: string): Promise<UrlResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const { data: file } = await admin.from("book_files").select("format,storage_path").eq("id", fileId).maybeSingle();
  if (!file) return { ok: false, error: "That file no longer exists." };

  const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(file.storage_path);
  if (dlError || !blob) return { ok: false, error: "Couldn't read the file from storage." };

  const cover = await extractCover(new Uint8Array(await blob.arrayBuffer()), file.format as BookFormat);
  if (!cover.ok) return { ok: false, error: cover.reason };

  const ext = cover.mime === "image/jpeg" ? "jpg" : cover.mime.split("/")[1];
  const path = `${randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from("media").upload(path, cover.bytes, { contentType: cover.mime });
  if (upErr) return { ok: false, error: "Couldn't store the extracted cover." };
  const { data: urlData } = admin.storage.from("media").getPublicUrl(path);

  await admin.from("media_assets").insert({ storage_path: path, url: urlData.publicUrl, kind: "image", title: `Cover — ${cover.source}` });
  revalidatePath("/admin/media");
  return { ok: true, url: urlData.publicUrl };
}

/** Staff-only "download to test": a link that dies after 60 seconds. */
export async function getBookFileTestUrl(fileId: string): Promise<UrlResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const { data: file } = await admin.from("book_files").select("storage_path,original_name").eq("id", fileId).maybeSingle();
  if (!file) return { ok: false, error: "That file no longer exists." };
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(file.storage_path, 60, { download: file.original_name });
  if (error || !data) return { ok: false, error: "Couldn't create a test link." };
  return { ok: true, url: data.signedUrl };
}
