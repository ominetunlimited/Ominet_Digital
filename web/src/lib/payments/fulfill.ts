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
    .select("id,status,content_id,product_id,user_id,guest_key,email,amount_cents")
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

  if (newStatus === "paid") {
    // Check-then-insert rather than upsert+onConflict: the unique indexes
    // backing this are partial (guest_key/user_id are mutually optional),
    // and Postgres can't infer a partial index as an ON CONFLICT target
    // without a matching WHERE predicate, which PostgREST's upsert has no
    // way to supply. Same pattern already used for anonymous likes.
    const identity = order.user_id
      ? { column: "user_id" as const, value: order.user_id }
      : { column: "guest_key" as const, value: order.guest_key };
    const targetColumn = order.content_id ? ("content_id" as const) : ("product_id" as const);
    const targetValue = order.content_id ?? order.product_id;

    if (identity.value && targetValue) {
      const { data: existing } = await admin
        .from("entitlements")
        .select("id")
        .eq(identity.column, identity.value)
        .eq(targetColumn, targetValue)
        .maybeSingle();

      if (!existing) {
        await admin.from("entitlements").insert({
          [identity.column]: identity.value,
          [targetColumn]: targetValue,
          order_id: order.id,
          email: order.email,
        });
      }
    }
  }

  return { alreadyFulfilled: false, order, status: newStatus };
}
