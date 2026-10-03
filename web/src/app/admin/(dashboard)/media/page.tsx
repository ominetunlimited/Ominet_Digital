import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const metadata = { title: "Media Library — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminMediaPage() {
  const supabase = await createClient();
  const { data: rows, error } = supabase
    ? await supabase
        .from("media_assets")
        .select("id,url,title,kind,storage_path,alt_text,caption,width,height,created_at,attribution,allow_download,show_on_studio,show_on_photography,display_order")
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  // 42703 = undefined column — show_on_photography (0027) may not be
  // applied to this project yet. Retry without it so the library still
  // loads; that one field just defaults to off until the migration runs.
  let data = rows;
  if (error?.code === "42703" && supabase) {
    const fallback = await supabase
      .from("media_assets")
      .select("id,url,title,kind,storage_path,alt_text,caption,width,height,created_at,attribution,allow_download,show_on_studio,display_order")
      .order("created_at", { ascending: false });
    data = (fallback.data ?? []).map((r) => ({ ...r, show_on_photography: false }));
  }

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Media Library</h1>
      <MediaLibrary initialAssets={data ?? []} />
    </div>
  );
}
