import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { fulfillPaystackReference } from "@/lib/payments/fulfill";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const valid = await verifyPaystackSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

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
