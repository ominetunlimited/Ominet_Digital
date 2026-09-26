"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { paystackInitCheckout, paystackConfigured } from "./paystack";
import { SITE_URL } from "@/lib/seo";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LineItem = { id: string; title: string; slug: string; price_cents: number | null; currency: string | null };

/**
 * Shared checkout core for both content and products: resolve the buyer's
 * identity (signed-in or guest), write the order, then hand off to
 * Paystack. Previously, a failure from paystackInitCheckout (a rejected
 * currency, a network stall, anything) threw straight out of this function
 * uncaught — the caller had no try/catch either, so the client saw an
 * unhandled rejection and the "Redirecting…" button never reset. Now every
 * failure path returns a real { ok: false, error } and marks the order
 * 'failed' instead of leaving it stuck at 'pending' forever.
 */
async function startCheckout(
  target: { contentId?: string; productId?: string },
  item: LineItem,
  guestEmail: string | undefined,
  callbackPath: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  const email = user?.email || guestEmail?.trim();
  if (!email) return { ok: false, error: "Enter your email to continue." };
  if (!user && !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };
  if (!item.price_cents) return { ok: false, error: "This item isn't priced yet." };

  const reference = `omd_${randomUUID()}`;
  const guestKey = user ? null : await getOrCreateAnonKey();
  const currency = item.currency || "NGN";

  const { data: order, error: orderError } = await supabase!
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      guest_key: guestKey,
      email,
      content_id: target.contentId ?? null,
      product_id: target.productId ?? null,
      amount_cents: item.price_cents,
      currency,
      provider: "paystack",
      provider_reference: reference,
      status: "pending",
    })
    .select("id")
    .single();
  if (orderError || !order) return { ok: false, error: orderError?.message ?? "Could not start checkout." };

  try {
    const checkout = await paystackInitCheckout({
      email,
      amountCents: item.price_cents,
      currency,
      reference,
      callbackUrl: `${SITE_URL}${callbackPath}`,
      metadata: { content_id: target.contentId, product_id: target.productId, slug: item.slug, title: item.title },
    });
    redirect(checkout.authorizationUrl);
  } catch (err) {
    // redirect() succeeds by throwing a framework signal (digest starting
    // with NEXT_REDIRECT) — never treat that as a checkout failure.
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest?: unknown }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    await supabase!.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    const message = err instanceof Error ? err.message : "Could not reach Paystack. Try again.";
    return { ok: false, error: message };
  }
}

/**
 * Starts a Paystack checkout for a paid content item. Guest-first: no
 * Ominet Digital account is required to buy. A signed-in reader's order is
 * still tied to their user_id as before; anyone else checks out as a guest
 * with just an email, and the purchase unlocks in their own browser via the
 * same cookie-derived key used for anonymous likes. Signing in via the
 * existing magic-link is still available separately, as a way to restore
 * access on a different device — it's no longer a precondition to buy.
 */
export async function startContentCheckout(contentId: string, guestEmail?: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Payments aren't configured yet." };
  if (!paystackConfigured) return { ok: false, error: "Paystack isn't configured yet — set PAYSTACK_SECRET_KEY." };

  const supabase = await createClient();
  const { data: content } = await supabase!
    .from("content")
    .select("id,title,price_cents,currency,slug")
    .eq("id", contentId)
    .maybeSingle();
  if (!content) return { ok: false, error: "This item isn't priced yet." };

  return startCheckout({ contentId: content.id }, content, guestEmail, "/checkout/callback");
}

/** Same as startContentCheckout, for Store products (books/downloads/etc). */
export async function startProductCheckout(productId: string, guestEmail?: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Payments aren't configured yet." };
  if (!paystackConfigured) return { ok: false, error: "Paystack isn't configured yet — set PAYSTACK_SECRET_KEY." };

  const supabase = await createClient();
  const { data: product } = await supabase!
    .from("products")
    .select("id,title,price_cents,currency,slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, error: "This item isn't priced yet." };

  return startCheckout({ productId: product.id }, product, guestEmail, "/checkout/callback");
}
