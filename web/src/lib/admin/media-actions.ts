"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; url?: string } | { ok: false; error: string };

export async function uploadMedia(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Choose a file first." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

  const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("image/") ? "image" : "document";

  const { error: insertError } = await supabase.from("media_assets").insert({
    storage_path: path,
    url: urlData.publicUrl,
    kind,
    title: file.name,
    uploaded_by: user?.id ?? null,
  });
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath("/admin/media");
  return { ok: true, url: urlData.publicUrl };
}

/** Edits an asset's own metadata (title/alt text/caption/Studio display) — never touches the file itself. */
export async function updateMediaAsset(
  id: string,
  patch: { title: string; alt_text: string; caption: string; attribution: string; allow_download: boolean; show_on_studio: boolean; display_order: number }
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  const title = patch.title.trim().slice(0, 200);
  const altText = patch.alt_text.trim().slice(0, 300);
  const caption = patch.caption.trim().slice(0, 500);
  const attribution = patch.attribution.trim().slice(0, 200);

  const { error } = await supabase
    .from("media_assets")
    .update({
      title: title || null,
      alt_text: altText || null,
      caption: caption || null,
      attribution: attribution || null,
      allow_download: patch.allow_download,
      show_on_studio: patch.show_on_studio,
      display_order: Number.isFinite(patch.display_order) ? patch.display_order : 0,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  revalidatePath("/ominet-digital");
  return { ok: true };
}

export async function deleteMedia(id: string, storagePath: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  await supabase.storage.from("media").remove([storagePath]);
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  return { ok: true };
}
