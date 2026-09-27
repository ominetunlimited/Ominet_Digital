import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import RedirectsManager from "@/components/admin/RedirectsManager";
import type { RedirectRow } from "@/components/admin/RedirectsManager";

export const metadata = { title: "Redirects — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

export default async function AdminRedirectsPage() {
  const supabase = await createClient();
  const { data, error } = supabase
    ? await supabase.from("redirects").select("*").order("created_at", { ascending: false })
    : { data: null, error: null };
  const missingTable = error && /redirects/.test(error.message);

  const rows: RedirectRow[] = (data ?? []).map((r) => ({
    id: r.id,
    fromPath: r.from_path,
    toPath: r.to_path,
    statusCode: r.status_code,
    active: r.active,
    archived: r.archived,
    hitCount: r.hit_count,
    lastHitAt: r.last_hit_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Redirects</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);max-width:64ch;")}>
        Send an old address (from a previous Blogger or WordPress site, or a page you&apos;ve since renamed) to its new one here.
        A redirect only ever takes effect for an address that isn&apos;t already a real page on this site — it can never override a working page.
      </p>
      {missingTable ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The redirects table isn&apos;t ready yet. Run 0019_redirects.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load redirects: {error.message}</p>
      ) : (
        <RedirectsManager initial={rows} />
      )}
    </div>
  );
}
