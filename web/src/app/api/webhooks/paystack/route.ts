import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { fulfillPaystackReference } from "@/lib/payments/fulfill";
import { queueAlert } from "@/lib/notify/telegram";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Layer 1 — authenticity: only Paystack (holder of the secret key) can
  // produce a matching HMAC-SHA512 over the exact bytes we received.
  const valid = await verifyPaystackSignature(rawBody, signature);
  if (!valid) {
    // Bucketed to 10 minutes so someone hammering this endpoint can't turn it
    // into a stream of Telegram messages.
    queueAlert("security", "Rejected Paystack webhook (bad signature)", ["Someone POSTed to the webhook without a valid signature."], {
      dedupeKey: `sig:${Math.floor(Date.now() / 600_000)}`,
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event?: string; created_at?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Layer 2 — replay visibility. A captured, still-validly-signed event can be
  // replayed, but it's already harmless: fulfillPaystackReference re-verifies
  // with Paystack and is idempotent (a paid order short-circuits). So we never
  // hard-drop a stale event here (that could drop a genuinely late first
  // delivery the callback redirect never sees). Instead we surface clearly
  // stale events as a dedupe'd alert so replay attempts are visible, and keep
  // processing through the idempotent path.
  const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes
  if (event.created_at) {
    const ageMs = Date.now() - new Date(event.created_at).getTime();
    if (Number.isFinite(ageMs) && ageMs > STALE_AFTER_MS) {
      queueAlert("security", "Stale Paystack webhook received", [`Event is ${Math.round(ageMs / 60000)} min old. Processed idempotently; check for replay if unexpected.`], {
        dedupeKey: `stale:${event.data?.reference ?? Math.floor(Date.now() / 600_000)}`,
      });
    }
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference as string | undefined;
    if (reference) {
      try {
        await fulfillPaystackReference(reference);
      } catch (e) {
        // Paystack retries on non-2xx, so log and 200 only once fulfillment
        // logic itself has run — a thrown error here should surface, not be
        // swallowed, so it gets retried instead of silently dropped.
        console.error("[paystack webhook] fulfillment failed", e);
        return NextResponse.json({ error: "fulfillment failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
