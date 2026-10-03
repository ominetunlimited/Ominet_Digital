import { SITE_URL } from "@/lib/seo";

// Newsletter sending via Mailgun's plain HTTP API — no SDK, just fetch and
// a form body, so this adds no dependency. Needs MAILGUN_API_KEY and
// MAILGUN_DOMAIN set (Vercel + .env.local); MAILGUN_REGION="eu" switches
// to Mailgun's EU endpoint if the sending domain was set up there.
//
// "From" is fixed to the address Mailgun's sending domain was actually
// verified for (info@ominetdigital.com.ng) rather than read from Site
// settings' editable contact email — Mailgun will reject (or shadowban)
// mail from an address its domain isn't authorized to send as.
const FROM = "Ominet Digital <info@ominetdigital.com.ng>";

export const mailgunConfigured = Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);

function apiBase(): string {
  const region = (process.env.MAILGUN_REGION || "us").toLowerCase();
  return region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
}

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * One campaign, fanned out to every recipient as its own individual email
 * (Mailgun's batch-sending: everyone in `to` gets a separate message, never
 * seeing each other's address) — not a single email BCC'd to everyone.
 * `html` may include `%recipient.unsubscribe_url%`, substituted per
 * recipient from `recipients[].unsubscribeToken`. Mailgun's own limit is
 * 1000 recipients per call; the caller chunks larger lists.
 */
export async function sendNewsletterBatch(
  subject: string,
  html: string,
  recipients: { email: string; unsubscribeToken: string }[]
): Promise<SendResult> {
  if (!mailgunConfigured) return { ok: false, error: "Mailgun isn't configured yet (MAILGUN_API_KEY / MAILGUN_DOMAIN)." };
  if (recipients.length === 0) return { ok: false, error: "No recipients." };
  if (recipients.length > 1000) return { ok: false, error: "More than 1000 recipients in one batch — this should have been chunked first." };

  const domain = process.env.MAILGUN_DOMAIN!;
  const recipientVariables: Record<string, { unsubscribe_url: string }> = {};
  for (const r of recipients) {
    recipientVariables[r.email] = { unsubscribe_url: `${SITE_URL}/unsubscribe?token=${r.unsubscribeToken}` };
  }

  const form = new FormData();
  form.set("from", FROM);
  form.set("to", recipients.map((r) => r.email).join(","));
  form.set("subject", subject);
  form.set("html", html);
  form.set("recipient-variables", JSON.stringify(recipientVariables));

  try {
    const res = await fetch(`${apiBase()}/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Mailgun said: ${res.status} ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't reach Mailgun." };
  }
}
