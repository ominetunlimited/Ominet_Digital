import Link from "next/link";
import { css } from "@/lib/css";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Audit log — Admin", robots: { index: false, follow: false } };
export const maxDuration = 60;

const PAGE_SIZE = 50;

const AREAS: Record<string, string> = {
  auth: "Sign-in",
  content: "Content",
  books: "Books",
  book_files: "Book files",
  products: "Store products",
  services: "Services",
  bookings: "Bookings",
  comments: "Comments",
  ad_placements: "Ad placements",
  ads: "Ads",
  ad_campaigns: "Ad campaigns",
  ad_advertisers: "Advertisers",
  social_accounts: "Social",
  research_profiles: "Research profiles",
  selected_work: "About page",
  site_settings: "Site settings",
  // (each section is its own row, so the log says which section changed)
  redirects: "Redirects",
  media_assets: "Media",
  profiles: "Roles & permissions",
};

const VERBS: Record<string, string> = {
  insert: "created",
  update: "updated",
  delete: "deleted",
  publish: "published",
  unpublish: "unpublished",
  archive: "archived",
  status_change: "changed status of",
  role_change: "changed the role of",
  login: "signed in",
  login_failed: "failed to sign in",
  login_blocked: "was blocked from signing in",
  logout: "signed out",
};

type Row = {
  id: number;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_label: string | null;
  metadata: Record<string, unknown> | null;
};

function describe(row: Row): { who: string; what: string; details: string } {
  const verb = VERBS[row.action.split(".").pop() ?? ""] ?? row.action;
  const meta = (row.metadata ?? {}) as Record<string, unknown> & { changed?: string[]; ip?: string; via?: string };
  const isAuth = row.entity_type === "auth";
  const who = row.actor_email || (isAuth ? row.entity_label || "unknown" : meta.via === "service_role" ? "The server" : "System");
  const area = (AREAS[row.entity_type] ?? row.entity_type).toLowerCase();
  const what = isAuth ? verb : `${verb} ${area}${row.entity_label ? ` “${row.entity_label}”` : ""}`;

  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v && typeof v === "object" && !Array.isArray(v) && "to" in v) {
      const { from, to } = v as { from: unknown; to: unknown };
      parts.push(`${k}: ${from === null || from === undefined ? "—" : String(from)} → ${to === null || to === undefined ? "—" : String(to)}`);
    }
  }
  if (Array.isArray(meta.changed)) parts.push(`fields: ${meta.changed.join(", ")}`);
  if (isAuth && meta.ip) parts.push(`from ${meta.ip}`);
  return { who, what, details: parts.join(" · ") };
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ area?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const area = params.area && AREAS[params.area] ? params.area : "";
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: isAdmin } = supabase ? await supabase.rpc("is_admin") : { data: false };

  if (!isAdmin) {
    return (
      <div>
        <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Audit log</h1>
        <p style={css("font-size:14px;opacity:0.7;")}>Only admins can view the audit log.</p>
      </div>
    );
  }

  let query = supabase!
    .from("audit_log")
    .select("id,created_at,actor_email,action,entity_type,entity_label,metadata", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (area) query = query.eq("entity_type", area);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ");
    query = query.or(`actor_email.ilike.%${safe}%,entity_label.ilike.%${safe}%,action.ilike.%${safe}%`);
  }
  const { data, count, error } = await query;
  const rows = (data ?? []) as Row[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const missingTable = error && /audit_log/.test(error.message);

  const link = (p: number) => `/admin/audit-log?${new URLSearchParams({ ...(area ? { area } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`;
  const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" });

  return (
    <div>
      <h1 style={css("font-family:var(--font-heading);font-size:28px;margin:0 0 var(--space-2);")}>Audit log</h1>
      <p style={css("font-size:13px;opacity:0.6;margin:0 0 var(--space-4);max-width:64ch;")}>
        Who changed what, and when (times are UTC). Entries can&apos;t be edited or deleted. Passwords, payment details, customer details and the text of your writing are never recorded — only which fields changed.
      </p>

      <form method="get" action="/admin/audit-log" style={css("display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);align-items:center;")}>
        <select className="input" name="area" defaultValue={area} style={css("max-width:200px;")}>
          <option value="">All areas</option>
          {Object.entries(AREAS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <input className="input" name="q" defaultValue={q} placeholder="Search person, item or action…" style={css("max-width:280px;")} />
        <button type="submit" className="btn btn-secondary">Filter</button>
        {(area || q) && <Link href="/admin/audit-log" style={css("font-size:13px;")}>Clear</Link>}
      </form>

      {missingTable ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>The audit_log table doesn&apos;t exist yet. Run 0016_audit_log.sql in the Supabase SQL Editor, then reload this page.</p>
      ) : error ? (
        <p style={css("font-size:14px;color:var(--om-coral);")}>Couldn&apos;t load the log: {error.message}</p>
      ) : rows.length === 0 ? (
        <p style={css("font-size:14px;opacity:0.6;")}>No entries {area || q ? "match these filters" : "yet"}.</p>
      ) : (
        <div style={css("display:grid;gap:var(--space-2);")}>
          {rows.map((r) => {
            const d = describe(r);
            const warn = r.action === "auth.login_failed" || r.action === "auth.login_blocked";
            return (
              <div key={r.id} className="card" style={css(`gap:4px;padding:var(--space-3) var(--space-4);${warn ? "border-color:var(--om-coral);" : ""}`)}>
                <div style={css("display:flex;justify-content:space-between;gap:var(--space-3);flex-wrap:wrap;font-size:12px;opacity:0.6;")}>
                  <span>{fmt.format(new Date(r.created_at))}</span>
                  <span>{AREAS[r.entity_type] ?? r.entity_type}</span>
                </div>
                <div style={css("font-size:14px;overflow-wrap:anywhere;")}>
                  <strong>{d.who}</strong> {d.what}
                </div>
                {d.details && <div style={css("font-size:12px;opacity:0.65;overflow-wrap:anywhere;")}>{d.details}</div>}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={css("display:flex;gap:var(--space-3);align-items:center;margin-top:var(--space-4);font-size:13px;")}>
          {page > 1 ? <Link href={link(page - 1)}>← Newer</Link> : <span style={css("opacity:0.4;")}>← Newer</span>}
          <span style={css("opacity:0.6;")}>Page {page} of {totalPages} · {count} entries</span>
          {page < totalPages ? <Link href={link(page + 1)}>Older →</Link> : <span style={css("opacity:0.4;")}>Older →</span>}
        </div>
      )}
    </div>
  );
}
