"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { paystackInitCheckout, paystackConfigured } from "./paystack";
import { SITE_URL } from "@/lib/seo";
import { getOrCreateAnonKey } from "@/lib/anon-key";
import { queueAlert } from "@/lib/notify/telegram";

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
  target: { contentId?: string; productId?: string; bookId?: string },
  item: LineItem,
  guestEmail: string | undefined,
  callbackPath: string
): Promise<ActionResult> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient!.auth.getUser();
  // Orders hold buyer emails, so guests can't write or read them through the
  // public API at all — the server writes them here, with values it chose.
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, error: "Payments aren't configured yet." };

  const email = user?.email || guestEmail?.trim();
  if (!email) return { ok: false, error: "Enter your email to continue." };
  if (!user && !EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };
  if (!item.price_cents) return { ok: false, error: "This item isn't priced yet." };

  const reference = `omd_${randomUUID()}`;
  const guestKey = user ? null : await getOrCreateAnonKey();
  const currency = item.currency || "NGN";

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      guest_key: guestKey,
      email,
      content_id: target.contentId ?? null,
      product_id: target.productId ?? null,
      ...(target.bookId ? { book_id: target.bookId } : {}),
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
      metadata: { content_id: target.contentId, product_id: target.productId, book_id: target.bookId, slug: item.slug, title: item.title },
    });
    redirect(checkout.authorizationUrl);
  } catch (err) {
    // redirect() succeeds by throwing a framework signal (digest starting
    // with NEXT_REDIRECT) — never treat that as a checkout failure.
    if (typeof err === "object" && err !== null && "digest" in err && typeof (err as { digest?: unknown }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    await supabase.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    const message = err instanceof Error ? err.message : "Could not reach Paystack. Try again.";
    // A visitor just failed to even reach checkout (e.g. a currency the live
    // account can't take) — that's worth knowing about straight away.
    queueAlert("payment_failed", "Checkout could not start", [`Item: ${item.title}`, `Reason: ${message}`.slice(0, 200)], {
      dedupeKey: `init:${reference}`,
    });
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

/**
 * Buy a book sold directly from this site. Everything that matters — that the
 * book is published, sold here, priced, and actually has a file to deliver —
 * is decided from the database, never from what the browser sends.
 */
export async function startBookCheckout(bookId: string, guestEmail?: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Payments aren't configured yet." };
  if (!paystackConfigured) return { ok: false, error: "Paystack isn't configured yet — set PAYSTACK_SECRET_KEY." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Payments aren't configured yet." };
  const { data: book } = await admin
    .from("books")
    .select("id,title,slug,price_cents,currency,sales_mode,status")
    .eq("id", bookId)
    .maybeSingle();
  if (!book || book.status !== "published" || book.sales_mode !== "direct_sale" || !book.price_cents || book.price_cents <= 0) {
    return { ok: false, error: "This book isn't available to buy here." };
  }
  const { count } = await admin.from("book_files").select("id", { count: "exact", head: true }).eq("book_id", book.id);
  if (!count) return { ok: false, error: "This book has no file to deliver yet, so it can't be bought." };

  return startCheckout({ bookId: book.id }, book, guestEmail, "/checkout/callback");
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
