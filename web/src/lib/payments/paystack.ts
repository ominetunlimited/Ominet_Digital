// Paystack REST integration. Docs: https://paystack.com/docs/api/transaction/
// Only the two calls checkout/webhook fulfillment need: initialize + verify.
// Adding another provider later means implementing this same shape against
// its API, not touching the checkout/webhook call sites.

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const API_BASE = "https://api.paystack.co";

export const paystackConfigured = Boolean(PAYSTACK_SECRET_KEY);

export type InitCheckoutInput = {
  email: string;
  amountCents: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export type InitCheckoutResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export async function paystackInitCheckout(input: InitCheckoutInput): Promise<InitCheckoutResult> {
  if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const res = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountCents, // Paystack takes the smallest currency unit (kobo for NGN, cents for USD)
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack initialize failed (${res.status})`);
  }
  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export type VerifyResult = {
  status: "success" | "failed" | "abandoned" | "pending";
  amountCents: number;
  currency: string;
  reference: string;
  metadata: Record<string, unknown> | null;
};

export async function paystackVerifyTransaction(reference: string): Promise<VerifyResult> {
  if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const res = await fetch(`${API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack verify failed (${res.status})`);
  }
  return {
    status: json.data.status,
    amountCents: json.data.amount,
    currency: json.data.currency,
    reference: json.data.reference,
    metadata: json.data.metadata ?? null,
  };
}

/** Verifies the `x-paystack-signature` header on an incoming webhook request. */
export async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!PAYSTACK_SECRET_KEY || !signature) return false;
  const crypto = await import("node:crypto");
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  return hash === signature;
}
