import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonKey } from "@/lib/anon-key";
import { MAX_FILE_BYTES, MAX_FILES, detectKind, safeName, extOf } from "@/lib/enquiry-upload";

export const dynamic = "force-dynamic";
const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const admin = createAdminClient();
  if (!admin) return err("Uploads aren't available right now. You can email the files to us instead.", 503);

  let form: FormData;
  try { form = await req.formData(); } catch { return err("That upload could not be read. Try again."); }
  const file = form.get("file");
  if (!(file instanceof File)) return err("No file received.");
  if (file.size === 0) return err("That file is empty.");
  if (file.size > MAX_FILE_BYTES) return err("That file is larger than 4 MB. Please send a smaller one, or email it to us.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectKind(file.name, bytes.slice(0, 16));
  if (!mime) return err(`We can't accept .${extOf(file.name) || "that"} files. Please use PDF, PNG, JPG, WebP, Word, Excel or PowerPoint.`);

  // Per-visitor limits for files not yet attached to an enquiry. Stops the form being used as free storage.
  const uploader = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("enquiry_uploads").select("id", { count: "exact", head: true }).eq("uploader", uploader).gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_FILES * 2) return err("You've uploaded a lot of files in a short time. Please try again later, or email the files to us.", 429);

  // Housekeeping: files abandoned before an enquiry was sent are removed after two days.
  const stale = await admin.from("enquiry_uploads").select("id,storage_path").is("booking_id", null).lt("created_at", new Date(Date.now() - 2 * 86_400_000).toISOString()).limit(25);
  if (stale.data?.length) {
    await admin.storage.from("enquiry-files").remove(stale.data.map((r) => r.storage_path as string));
    await admin.from("enquiry_uploads").delete().in("id", stale.data.map((r) => r.id as string));
  }

  const path = `pending/${randomUUID()}/${safeName(file.name)}`;
  const { error: upErr } = await admin.storage.from("enquiry-files").upload(path, bytes, { contentType: mime, upsert: false });
  if (upErr) return err("The file could not be saved. Please try again.", 500);
  const { data: row, error: dbErr } = await admin.from("enquiry_uploads")
    .insert({ storage_path: path, original_name: safeName(file.name), size_bytes: file.size, mime, uploader }).select("id,original_name,size_bytes").single();
  if (dbErr || !row) { await admin.storage.from("enquiry-files").remove([path]); return err("The file could not be recorded. Please try again.", 500); }
  return NextResponse.json({ ok: true, id: row.id, name: row.original_name, size: row.size_bytes }, { headers: { "Cache-Control": "no-store" } });
}
