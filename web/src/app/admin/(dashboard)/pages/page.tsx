import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import PagesManager from "@/components/admin/PagesManager";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "Pages — Admin", robots: { index: false, follow: false } };
// Always read fresh: what is shown here must be exactly what is stored.
export const dynamic = "force-dynamic";

export default async function PagesAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = supabase ? await supabase.rpc("is_admin") : { data: false };

  if (!isAdmin) {
    return (
      <div>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Pages</h1>
        <p style={css("font-size:14px;opacity:0.7;")}>Only admins can switch pages on or off.</p>
      </div>
    );
  }

  const { pages } = await getSiteSettings();
  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Pages</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);max-width:64ch;")}>
        Switch any tab on or off. A page that is off disappears from the menu, footer and sitemap, and its address shows &ldquo;not found&rdquo;. Nothing is deleted, so switching it back on restores it exactly as it was.
      </p>
      <PagesManager initial={pages} />
    </div>
  );
}
