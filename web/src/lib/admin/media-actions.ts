"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { validateDestination } from "@/lib/ad-validate";

export type ActionResult = { ok: true; url?: string } | { ok: false; error: string };

export async function uploadMedia(formData: FormData): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const user = { id: auth.userId };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Choose a file first." };

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
    uploaded_by: user.id,
  });
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath("/admin/media");
  return { ok: true, url: urlData.publicUrl };
}

/** Edits an asset's own metadata (title/alt text/caption/Studio+Photography display) — never touches the file itself. */
export async function updateMediaAsset(
  id: string,
  patch: {
    title: string;
    alt_text: string;
    caption: string;
    attribution: string;
    attribution_url: string;
    allow_download: boolean;
    show_on_studio: boolean;
    show_on_photography: boolean;
    show_on_hero: boolean;
    display_order: number;
  }
): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const title = patch.title.trim().slice(0, 200);
  const altText = patch.alt_text.trim().slice(0, 300);
  const caption = patch.caption.trim().slice(0, 500);
  const attribution = patch.attribution.trim().slice(0, 200);
  const attributionUrlText = patch.attribution_url.trim();
  let attributionUrl: string | null = null;
  if (attributionUrlText) {
    const checked = validateDestination(attributionUrlText);
    if (!checked.ok || checked.url.startsWith("/")) return { ok: false, error: `Attribution link: ${checked.ok ? "enter the full https:// address." : checked.error}` };
    attributionUrl = checked.url;
  }

  const row: Record<string, unknown> = {
    title: title || null,
    alt_text: altText || null,
    caption: caption || null,
    attribution: attribution || null,
    attribution_url: attributionUrl,
    allow_download: patch.allow_download,
    show_on_studio: patch.show_on_studio,
    show_on_photography: patch.show_on_photography,
    show_on_hero: patch.show_on_hero,
    display_order: Number.isFinite(patch.display_order) ? patch.display_order : 0,
  };

  let { error } = await supabase.from("media_assets").update(row).eq("id", id);
  // PGRST204 = PostgREST couldn't find that column in its schema cache (its
  // own pre-flight check on a write payload); 42703 is the raw Postgres
  // "undefined column" error. show_on_photography (0027) or
  // show_on_hero/attribution_url (0029) may not be applied to this project
  // yet — retry progressively without them so the rest still saves.
  if (error?.code === "42703" || error?.code === "PGRST204") {
    delete row.show_on_hero;
    delete row.attribution_url;
    ({ error } = await supabase.from("media_assets").update(row).eq("id", id));
  }
  if (error?.code === "42703" || error?.code === "PGRST204") {
    delete row.show_on_photography;
    ({ error } = await supabase.from("media_assets").update(row).eq("id", id));
  }
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  revalidatePath("/ominet-digital");
  revalidatePath("/media");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMedia(id: string, storagePath: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  await supabase.storage.from("media").remove([storagePath]);
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  return { ok: true };
}
