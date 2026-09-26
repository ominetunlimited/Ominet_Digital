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
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  const email = user?.email || guestEmail?.trim();
  if (!email) return { ok: false, error: "Enter your email to continue." };
  if (!user && !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };

  const { data: content } = await supabase!
    .from("content")
    .select("id,title,price_cents,currency,slug")
    .eq("id", contentId)
    .maybeSingle();
  if (!content?.price_cents) return { ok: false, error: "This item isn't priced yet." };

  const reference = `omd_${randomUUID()}`;
  const guestKey = user ? null : await getOrCreateAnonKey();

  const { error: orderError } = await supabase!.from("orders").insert({
    user_id: user?.id ?? null,
    guest_key: guestKey,
    email,
    content_id: content.id,
    amount_cents: content.price_cents,
    currency: content.currency || "NGN",
    provider: "paystack",
    provider_reference: reference,
    status: "pending",
  });
  if (orderError) return { ok: false, error: orderError.message };

  const checkout = await paystackInitCheckout({
    email,
    amountCents: content.price_cents,
    currency: content.currency || "NGN",
    reference,
    callbackUrl: `${SITE_URL}/checkout/callback`,
    metadata: { content_id: content.id, slug: content.slug, title: content.title },
  });

  redirect(checkout.authorizationUrl);
}
