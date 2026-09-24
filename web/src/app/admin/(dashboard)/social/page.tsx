import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";
import SocialComposer from "@/components/admin/SocialComposer";

export const metadata = { title: "Social — Admin", robots: { index: false, follow: false } };

export default async function AdminSocialPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: items }] = supabase
    ? await Promise.all([
        supabase.from("social_accounts").select("platform,status"),
        supabase.from("content").select("id,title,slug,excerpt").eq("status", "published").order("published_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-6);")}>Social</h1>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>ACCOUNTS</div>
      <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-8);")}>
        {(accounts ?? []).map((a) => (
          <div key={a.platform} className="card" style={css("flex:1 1 140px;")}>
            <div style={css("text-transform:capitalize;font-weight:700;")}>{a.platform}</div>
            <div style={css("font-size:12px;opacity:0.6;")}>{a.status.replace("_", " ")}</div>
          </div>
        ))}
      </div>
      <p style={css("font-size:12px;opacity:0.5;margin:calc(var(--space-8) * -1) 0 var(--space-8);")}>
        No platform is API-connected yet — connecting one requires that platform&apos;s developer app + OAuth credentials.
        Until then, sharing below opens a pre-filled post window per platform.
      </p>

      <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>COMPOSE</div>
      <SocialComposer items={items ?? []} />
    </div>
  );
}
