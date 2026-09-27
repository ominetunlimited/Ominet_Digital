import { createClient } from "@/lib/supabase/server";
import { describeAuditEntry, type AuditRow } from "@/lib/admin/audit-format";
import { getIntegrationStatus } from "@/lib/admin/integrations";

export type DashboardData = {
  configured: boolean;
  counts: { drafts: number; scheduled: number; published: number; pendingComments: number; pendingBookings: number; subscribers: number };
  recentContent: { id: string; title: string; type: string; access: string; status: string }[];
  recentActivity: ReturnType<typeof describeAuditEntry>[];
  integrations: { ok: number; warn: number; off: number; worst: "ok" | "warn" | "off" };
};

const EMPTY: DashboardData = {
  configured: false,
  counts: { drafts: 0, scheduled: 0, published: 0, pendingComments: 0, pendingBookings: 0, subscribers: 0 },
  recentContent: [],
  recentActivity: [],
  integrations: { ok: 0, warn: 0, off: 0, worst: "off" },
};

/** A count query that never throws — a missing table just reads as zero. */
async function safeCount(promise: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count, error } = await promise;
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export async function loadDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  if (!supabase) return EMPTY;

  const [drafts, scheduled, published, pendingComments, pendingBookings, subscribers, recentContentRes, recentAuditRes, integrations] = await Promise.all([
    safeCount(supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "draft")),
    safeCount(supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "scheduled")),
    safeCount(supabase.from("content").select("id", { count: "exact", head: true }).eq("status", "published")),
    safeCount(supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending")),
    safeCount(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending")),
    safeCount(supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true })),
    supabase.from("content").select("id,title,type,access,status").order("created_at", { ascending: false }).limit(6),
    supabase.from("audit_log").select("id,created_at,actor_email,action,entity_type,entity_label,metadata").order("id", { ascending: false }).limit(6),
    getIntegrationStatus().catch(() => []),
  ]);

  const summary = { ok: 0, warn: 0, off: 0 };
  for (const i of integrations) summary[i.state]++;
  const worst: "ok" | "warn" | "off" = summary.off > 0 ? "off" : summary.warn > 0 ? "warn" : "ok";

  return {
    configured: true,
    counts: { drafts, scheduled, published, pendingComments, pendingBookings, subscribers },
    recentContent: recentContentRes.error ? [] : recentContentRes.data ?? [],
    recentActivity: recentAuditRes.error ? [] : (recentAuditRes.data as AuditRow[] | null ?? []).map(describeAuditEntry),
    integrations: { ...summary, worst },
  };
}
