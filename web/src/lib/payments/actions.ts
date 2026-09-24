"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { paystackInitCheckout, paystackConfigured } from "./paystack";
import { SITE_URL } from "@/lib/seo";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Sends a Supabase magic-link/OTP email so a reader can sign in without a password. */
export async function sendLoginLink(email: string, next: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Sign-in isn't configured yet." };
  const supabase = await createClient();
  const { error } = await supabase!.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Check your email for a sign-in link." };
}

/**
 * Starts a Paystack checkout for a paid content item. Requires the reader to
 * already be signed in (see sendLoginLink) — the order is tied to their
 * user_id so the webhook can grant the entitlement unambiguously.
 */
export async function startContentCheckout(contentId: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Payments aren't configured yet." };
  if (!paystackConfigured) return { ok: false, error: "Paystack isn't configured yet — set PAYSTACK_SECRET_KEY." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user?.email) return { ok: false, error: "Sign in first to purchase." };

  const { data: content } = await supabase!
    .from("content")
    .select("id,title,price_cents,currency,slug")
    .eq("id", contentId)
    .maybeSingle();
  if (!content?.price_cents) return { ok: false, error: "This item isn't priced yet." };

  const reference = `omd_${randomUUID()}`;

  const { error: orderError } = await supabase!.from("orders").insert({
    user_id: user.id,
    email: user.email,
    content_id: content.id,
    amount_cents: content.price_cents,
    currency: content.currency || "NGN",
    provider: "paystack",
    provider_reference: reference,
    status: "pending",
  });
  if (orderError) return { ok: false, error: orderError.message };

  const checkout = await paystackInitCheckout({
    email: user.email,
    amountCents: content.price_cents,
    currency: content.currency || "NGN",
    reference,
    callbackUrl: `${SITE_URL}/checkout/callback`,
    metadata: { content_id: content.id, slug: content.slug, title: content.title },
  });

  redirect(checkout.authorizationUrl);
}
