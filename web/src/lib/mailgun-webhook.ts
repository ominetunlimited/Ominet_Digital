import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeliveryStatus = "delivered" | "opened" | "clicked" | "deferred" | "bounced" | "complained" | "unsubscribed" | "rejected";

/** Mailgun signs every webhook: HMAC-SHA256(signingKey, timestamp + token). */
export function verifySignature(key: string, s: { timestamp?: string; token?: string; signature?: string }, now = Date.now()): boolean {
  if (!key || !s.timestamp || !s.token || !s.signature) return false;
  const ts = Number(s.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 15 * 60) return false; // stale or replayed
  const expected = createHmac("sha256", key).update(s.timestamp + s.token).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(s.signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getSigningKey(): Promise<string | null> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("integration_settings").select("value").eq("key", "mailgun_webhook").maybeSingle();
    const k = (data?.value as { signingKey?: string } | null)?.signingKey;
    if (k) return k;
  }
  return process.env.MAILGUN_WEBHOOK_SIGNING_KEY || null;
}

/** Mailgun's own event names mapped to what the team sees. "accepted" changes nothing: it is already what we recorded. */
export function mapEvent(event: string, severity?: string): DeliveryStatus | null {
  switch (event) {
    case "delivered": return "delivered";
    case "opened": return "opened";
    case "clicked": return "clicked";
    case "failed": return severity === "temporary" ? "deferred" : "bounced";
    case "rejected": return "rejected";
    case "complained": return "complained";
    case "unsubscribed": return "unsubscribed";
    default: return null;
  }
}

// A later, weaker event must never overwrite a worse or more final one (an "opened" after "bounced" is noise).
const RANK: Record<DeliveryStatus, number> = { deferred: 1, delivered: 2, opened: 3, clicked: 4, unsubscribed: 5, bounced: 6, rejected: 6, complained: 7 };
export const shouldUpdate = (current: DeliveryStatus | null, next: DeliveryStatus) => !current || RANK[next] >= RANK[current] || (current === "deferred" && next !== "deferred");

export const normaliseMessageId = (id: string | undefined | null) => (id ?? "").replace(/^<|>$/g, "").trim();
