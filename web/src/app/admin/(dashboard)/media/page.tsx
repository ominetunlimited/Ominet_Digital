import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const metadata = { title: "Media Library — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminMediaPage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("media_assets").select("id,url,title,kind,storage_path").order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Media Library</h1>
      <MediaLibrary initialAssets={data ?? []} />
    </div>
  );
}
