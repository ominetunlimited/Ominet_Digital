"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAttachment, ALLOWED_ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_BYTES, type AttachmentFormat } from "@/lib/content/attachment";

const BUCKET = "content-files"; // PRIVATE — no public URLs
const PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|docx)$/;

export type UploadTicket = { ok: true; path: string; token: string } | { ok: false; error: string };
export type ConfirmResult = { ok: true; format: AttachmentFormat; originalName: string; sizeBytes: number } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };
export type UrlResult = { ok: true; url: string } | { ok: false; error: string };

async function staffCheck(): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireStaff();
  return auth.ok ? { ok: true } : { ok: false, error: auth.error };
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Step 1: a one-time link the browser uploads straight to storage with, issued only to staff. */
export async function requestContentFileUpload(contentId: string, fileName: string, sizeBytes: number): Promise<UploadTicket> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;

  const format = ALLOWED_ATTACHMENT_EXTENSIONS[extensionOf(fileName)];
  if (!format) return { ok: false, error: "Only PDF or DOCX files can be uploaded." };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { ok: false, error: "That file is empty." };
  if (sizeBytes > MAX_ATTACHMENT_BYTES) return { ok: false, error: "That file is larger than the 25 MB limit." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };
  const { data: article } = await admin.from("content").select("id").eq("id", contentId).maybeSingle();
  if (!article) return { ok: false, error: "Save the article first, then attach a file to it." };

  const path = `${contentId}/${randomUUID()}.${format}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Couldn't start the upload. Try again." };
  return { ok: true, path: data.path, token: data.token };
}

/** Step 2: re-reads the uploaded file, checks what it REALLY is, and only then records it. */
export async function confirmContentFile(contentId: string, path: string, originalName: string): Promise<ConfirmResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  if (!PATH_RE.test(path) || !path.startsWith(`${contentId}/`)) return { ok: false, error: "That upload isn't recognised." };
  const format = path.slice(path.lastIndexOf(".") + 1) as AttachmentFormat;

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const reject = async (error: string): Promise<ConfirmResult> => {
    await admin.storage.from(BUCKET).remove([path]);
    return { ok: false, error };
  };

  const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(path);
  if (dlError || !blob) return { ok: false, error: "The upload didn't arrive. Please try again." };
  if (blob.size > MAX_ATTACHMENT_BYTES) return reject("That file is larger than the 25 MB limit.");

  const check = await validateAttachment(new Uint8Array(await blob.arrayBuffer()), format);
  if (!check.ok) return reject(check.error);

  const { data: existing } = await admin.from("content").select("attachment_storage_path").eq("id", contentId).maybeSingle();
  if (existing?.attachment_storage_path) await admin.storage.from(BUCKET).remove([existing.attachment_storage_path]);

  const safeName = originalName.replace(/[\\/\u0000-\u001f]/g, "").slice(0, 200) || `article.${format}`;
  const { error } = await admin
    .from("content")
    .update({ attachment_storage_path: path, attachment_original_name: safeName, attachment_format: format, attachment_size_bytes: check.sizeBytes })
    .eq("id", contentId);
  if (error) return reject("Couldn't save the file record. Try again.");

  revalidatePath(`/admin/content/${contentId}`);
  return { ok: true, format, originalName: safeName, sizeBytes: check.sizeBytes };
}

export async function removeContentFile(contentId: string): Promise<PlainResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const { data: article } = await admin.from("content").select("attachment_storage_path").eq("id", contentId).maybeSingle();
  if (!article?.attachment_storage_path) return { ok: false, error: "There's no file attached." };
  await admin.storage.from(BUCKET).remove([article.attachment_storage_path]);
  const { error } = await admin
    .from("content")
    .update({ attachment_storage_path: null, attachment_original_name: null, attachment_format: null, attachment_size_bytes: null })
    .eq("id", contentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/content/${contentId}`);
  return { ok: true };
}

/** Staff-only "download to test": a link that dies after 60 seconds. */
export async function getContentFileTestUrl(contentId: string): Promise<UrlResult> {
  const staff = await staffCheck();
  if (!staff.ok) return staff;
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Storage isn't configured." };

  const { data: article } = await admin.from("content").select("attachment_storage_path,attachment_original_name").eq("id", contentId).maybeSingle();
  if (!article?.attachment_storage_path) return { ok: false, error: "There's no file attached." };
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(article.attachment_storage_path, 60, { download: article.attachment_original_name ?? undefined });
  if (error || !data) return { ok: false, error: "Couldn't create a test link." };
  return { ok: true, url: data.signedUrl };
}
