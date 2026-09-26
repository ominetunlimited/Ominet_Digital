import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Best-effort caller address as the hosting platform reports it. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
}

type AuditEvent = {
  action: string;
  entityType: string;
  entityId?: string;
  label?: string;
  actor?: { id: string; email?: string | null };
  metadata?: Record<string, unknown>;
};

/**
 * Records an event that isn't a database row change (sign-in, sign-out...).
 * Row changes are logged by database triggers instead. Never throws: a
 * failure to log must not break the action being logged. Never pass secrets,
 * passwords, tokens or card data in `metadata`.
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin.from("audit_log").insert({
      actor_id: event.actor?.id ?? null,
      actor_email: event.actor?.email ?? null,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId ?? null,
      entity_label: event.label?.slice(0, 200) ?? null,
      metadata: { via: "app", ...(event.metadata ?? {}) },
    });
  } catch {
    // intentionally silent
  }
}

/** How many failed sign-ins in the last `minutes`, for this email+address and for the address overall. */
export async function recentFailedLogins(email: string, ip: string, minutes = 15): Promise<{ forEmailAndIp: number; forIp: number }> {
  try {
    const admin = createAdminClient();
    if (!admin) return { forEmailAndIp: 0, forIp: 0 };
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const [a, b] = await Promise.all([
      admin.from("audit_log").select("id", { count: "exact", head: true }).eq("action", "auth.login_failed").eq("metadata->>email", email).eq("metadata->>ip", ip).gte("created_at", since),
      admin.from("audit_log").select("id", { count: "exact", head: true }).eq("action", "auth.login_failed").eq("metadata->>ip", ip).gte("created_at", since),
    ]);
    return { forEmailAndIp: a.count ?? 0, forIp: b.count ?? 0 };
  } catch {
    return { forEmailAndIp: 0, forIp: 0 };
  }
}
