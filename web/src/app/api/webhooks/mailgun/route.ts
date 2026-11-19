import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSigningKey, mapEvent, normaliseMessageId, shouldUpdate, verifySignature, type DeliveryStatus } from "@/lib/mailgun-webhook";

export const dynamic = "force-dynamic";

type Payload = {
  signature?: { timestamp?: string; token?: string; signature?: string };
  "event-data"?: {
    id?: string; event?: string; severity?: string; timestamp?: number; recipient?: string; reason?: string;
    message?: { headers?: { "message-id"?: string } };
    "delivery-status"?: { description?: string; message?: string };
  };
};

export async function POST(req: Request) {
  const key = await getSigningKey();
  if (!key) return NextResponse.json({ error: "Webhook signing key is not set up." }, { status: 406 });
  let body: Payload;
  try { body = (await req.json()) as Payload; } catch { return NextResponse.json({ error: "Bad body" }, { status: 400 }); }
  // 406 tells Mailgun not to retry a request we are refusing.
  if (!verifySignature(key, body.signature ?? {})) return NextResponse.json({ error: "Invalid signature" }, { status: 406 });

  const ev = body["event-data"];
  const admin = createAdminClient();
  if (!ev?.event || !admin) return NextResponse.json({ ok: true });

  const providerId = normaliseMessageId(ev.message?.headers?.["message-id"]);
  const status = mapEvent(ev.event, ev.severity);
  const reason = (ev["delivery-status"]?.description || ev["delivery-status"]?.message || ev.reason || "").slice(0, 300) || null;
  const occurred = new Date((ev.timestamp ?? Date.now() / 1000) * 1000).toISOString();

  // Our stored id has the angle brackets Mailgun returned when accepting the message.
  const { data: log } = providerId
    ? await admin.from("email_log").select("id,delivery_status").in("provider_id", [providerId, `<${providerId}>`]).limit(1).maybeSingle()
    : { data: null };

  // Mailgun retries and can repeat events: the event id makes this idempotent.
  const eventId = ev.id || `${providerId}:${ev.event}:${occurred}`;
  const { error: dup } = await admin.from("email_events").insert({
    event_id: eventId, email_log_id: log?.id ?? null, provider_id: providerId || null, event: ev.event, recipient: ev.recipient ?? null, reason, occurred_at: occurred,
  });
  if (dup) return NextResponse.json({ ok: true, duplicate: true });

  if (log && status && shouldUpdate((log.delivery_status as DeliveryStatus | null) ?? null, status)) {
    await admin.from("email_log").update({
      delivery_status: status, delivery_detail: reason, last_event_at: occurred, ...(status === "delivered" ? { delivered_at: occurred } : {}),
    }).eq("id", log.id);
  }
  return NextResponse.json({ ok: true });
}
