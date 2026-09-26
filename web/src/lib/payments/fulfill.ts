import { createAdminClient } from "@/lib/supabase/admin";
import { paystackVerifyTransaction } from "./paystack";

/**
 * Source of truth for turning a Paystack reference into a paid order +
 * granted entitlement. Called from both the webhook (authoritative) and the
 * checkout callback redirect (fast UX path) — idempotent either way, since
 * it re-verifies with Paystack directly rather than trusting the caller.
 */
export async function fulfillPaystackReference(reference: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured");

  const verified = await paystackVerifyTransaction(reference);

  const { data: order } = await admin
    .from("orders")
    .select("id,status,content_id,product_id,user_id,amount_cents")
    .eq("provider_reference", reference)
    .maybeSingle();
  if (!order) throw new Error(`No order found for reference ${reference}`);

  if (order.status === "paid") return { alreadyFulfilled: true, order };

  const newStatus = verified.status === "success" ? "paid" : "failed";

  await admin
    .from("payments")
    .insert({
      order_id: order.id,
      provider: "paystack",
      provider_reference: reference,
      status: newStatus,
      raw_payload: verified as unknown as Record<string, unknown>,
    });

  await admin.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", order.id);

  await admin.from("analytics_events").insert({
    event_type: newStatus === "paid" ? "purchase" : "payment_failed",
    content_id: order.content_id,
    product_id: order.product_id,
    metadata: { amount_cents: order.amount_cents, reference },
  });

  if (newStatus === "paid" && order.user_id) {
    await admin
      .from("entitlements")
      .upsert(
        {
          user_id: order.user_id,
          content_id: order.content_id,
          product_id: order.product_id,
          order_id: order.id,
        },
        { onConflict: order.content_id ? "user_id,content_id" : "user_id,product_id" }
      );
  }

  return { alreadyFulfilled: false, order, status: newStatus };
}
