"use server";

import { requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

/** Staff-only. Returns a link that works for one minute, so files never get a permanent public address. */
export async function getEnquiryFileUrl(uploadId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) return { ok: false, error: "Not a valid file." };
  const { data: row } = await auth.supabase.from("enquiry_uploads").select("storage_path,original_name").eq("id", uploadId).maybeSingle();
  if (!row) return { ok: false, error: "That file no longer exists." };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "File storage isn't configured." };
  const { data, error } = await admin.storage.from("enquiry-files").createSignedUrl(row.storage_path as string, 60, { download: row.original_name as string });
  if (error || !data?.signedUrl) return { ok: false, error: "Could not open that file." };
  return { ok: true, url: data.signedUrl };
}
