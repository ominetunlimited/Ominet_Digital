import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { getSiteSettings } from "@/lib/site-settings";
import { getIntegrationStatus } from "@/lib/admin/integrations";

export const metadata = { title: "Site settings — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;
// Always read fresh: an admin who just saved must see exactly what was stored.
export const dynamic = "force-dynamic";

const DOT = { ok: "#1f9d55", warn: "#d98e04", off: "#8a8f98" } as const;

export default async function SiteSettingsPage() {
  const supabase = await createClient();
  const { data: isAdmin } = supabase ? await supabase.rpc("is_admin") : { data: false };

  if (!isAdmin) {
    return (
      <div>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Site settings</h1>
        <p style={css("font-size:14px;opacity:0.7;")}>Only admins can view and change site settings.</p>
      </div>
    );
  }

  const [settings, integrations] = await Promise.all([getSiteSettings(), getIntegrationStatus()]);

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Site settings</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-6);max-width:64ch;")}>
        How the whole site presents itself. Each section saves on its own and appears on the site straight away; every change is recorded in the audit log.
        Passwords, API keys and tokens are never entered here — they stay in the server&apos;s environment.
      </p>

      <SiteSettingsForm initial={settings} />

      <h2 style={css("font-family:var(--font-heading);font-size:20px;margin:var(--space-8) 0 var(--space-2);")}>Connected services</h2>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);max-width:64ch;")}>
        Read-only status. To change a credential, update it in Vercel → Settings → Environment Variables and redeploy.
      </p>
      <div style={css("display:grid;gap:var(--space-2);max-width:720px;")}>
        {integrations.map((i) => (
          <div key={i.name} className="card" style={css("gap:4px;padding:var(--space-3) var(--space-4);")}>
            <div style={css("display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;")}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: DOT[i.state], display: "inline-block" }} />
              <strong style={css("font-size:14px;")}>{i.name}</strong>
              <span style={css("font-size:13px;opacity:0.75;overflow-wrap:anywhere;")}>{i.summary}</span>
            </div>
            {i.detail && <div style={css("font-size:12px;opacity:0.6;overflow-wrap:anywhere;")}>{i.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
