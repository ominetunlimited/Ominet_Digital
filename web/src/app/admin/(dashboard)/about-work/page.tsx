import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import SelectedWorkManager from "@/components/admin/SelectedWorkManager";
import { mapWork } from "@/lib/selected-work";

export const metadata = { title: "About page — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AboutWorkPage() {
  const supabase = await createClient();
  const { data, error } = supabase ? await supabase.from("selected_work").select("*").order("display_order") : { data: null, error: null };
  const missingTable = error && /selected_work/.test(error.message);

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>About page &mdash; selected work</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);max-width:60ch;")}>
        The list under &ldquo;Selected work&rdquo; on the About page. Add, edit, reorder, hide or remove entries; changes appear on the site as soon as you save.
        Only list things that are accurate — nothing here is checked for you.
      </p>
      {missingTable ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The selected_work table doesn&apos;t exist yet. Run 0015_selected_work.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load the list: {error.message}</p>
      ) : (
        <SelectedWorkManager initial={(data ?? []).map(mapWork)} />
      )}
    </div>
  );
}
