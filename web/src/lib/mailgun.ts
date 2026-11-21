import { SITE_URL } from "@/lib/seo";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

// Newsletter sending via Mailgun's plain HTTP API — no SDK, just fetch and
// a form body, so this adds no dependency.
//
// Config is read from the integration_settings table (Admin -> Newsletter
// -> Mailgun setup), set once by an admin rather than a Vercel environment
// variable. Env vars (MAILGUN_API_KEY/MAILGUN_DOMAIN/MAILGUN_REGION) still
// work as a fallback for anyone who wired this up before that UI existed,
// but the database value wins when both are present.
//
// "From" is fixed to the address Mailgun's sending domain was actually
// verified for (info@ominetdigital.com.ng) rather than read from Site
// settings' editable contact email — Mailgun will reject (or shadowban)
// mail from an address its domain isn't authorized to send as.
const FROM = "Ominet Digital <info@ominetdigital.com.ng>";

export type MailgunConfig = { apiKey: string; domain: string; region: "us" | "eu" };

export async function getMailgunConfig(): Promise<MailgunConfig | null> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("integration_settings").select("value").eq("key", "mailgun").maybeSingle();
    const v = (data?.value ?? null) as Partial<MailgunConfig> | null;
    if (v?.apiKey && v?.domain) return { apiKey: v.apiKey, domain: v.domain, region: v.region === "eu" ? "eu" : "us" };
  }
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return { apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN, region: process.env.MAILGUN_REGION === "eu" ? "eu" : "us" };
  }
  return null;
}

export async function isMailgunConfigured(): Promise<boolean> {
  return (await getMailgunConfig()) !== null;
}

function apiBase(region: "us" | "eu"): string {
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
  const config = await getMailgunConfig();
  if (!config) return { ok: false, error: "Mailgun isn't configured yet — set it up in Admin → Newsletter." };
  if (recipients.length === 0) return { ok: false, error: "No recipients." };
  if (recipients.length > 1000) return { ok: false, error: "More than 1000 recipients in one batch — this should have been chunked first." };

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
    const res = await fetch(`${apiBase(config.region)}/v3/${config.domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}` },
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


export type TransactionalMail = { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: { filename: string; content: Uint8Array; contentType: string }[] };
export type TransactionalResult = { ok: true; providerId: string | null } | { ok: false; error: string; notConfigured?: boolean };

/**
 * One-to-one transactional email (acknowledgements, internal notifications).
 * A 200 from Mailgun means "accepted for sending", NOT "delivered": callers
 * should record it as "accepted" and let webhooks (when added) move it to
 * delivered / bounced.
 */
export async function sendTransactional(mail: TransactionalMail): Promise<TransactionalResult> {
  const config = await getMailgunConfig();
  if (!config) {
    const smtp = getSmtpConfig();
    if (smtp) return sendViaSmtp(smtp, mail);
    return { ok: false, error: "Mailgun isn't configured.", notConfigured: true };
  }
  const form = new FormData();
  form.set("from", FROM);
  form.set("to", mail.to);
  form.set("subject", mail.subject);
  form.set("html", mail.html);
  form.set("text", mail.text);
  if (mail.replyTo) form.set("h:Reply-To", mail.replyTo);
  for (const a of mail.attachments ?? []) form.append("attachment", new Blob([a.content as BlobPart], { type: a.contentType }), a.filename);
  try {
    const res = await fetch(`${apiBase(config.region)}/v3/${config.domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}` },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Mailgun said: ${res.status} ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, providerId: json?.id ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't reach Mailgun." };
  }
}


// ── SMTP route ──────────────────────────────────────────────────────────────
// Mailgun also accepts mail over SMTP (smtp.mailgun.org). If no Mailgun API key is set but SMTP_* variables are,
// one-to-one transactional mail (acknowledgements, notifications, quotations, PDFs) goes this way.
// The API key route, when configured, takes precedence. Newsletter batches still need the API key because
// per-recipient batch sending is an API feature. Credentials come only from server-side environment variables.
export type SmtpConfig = { host: string; port: number; user: string; pass: string };

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return { host, port: Number(process.env.SMTP_PORT) || 587, user, pass };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

async function sendViaSmtp(cfg: SmtpConfig, mail: TransactionalMail): Promise<TransactionalResult> {
  const from = process.env.MAIL_FROM_ADDRESS ? `${process.env.MAIL_FROM_NAME || "Ominet Digital"} <${process.env.MAIL_FROM_ADDRESS}>` : FROM;
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465, requireTLS: cfg.port !== 465,
      auth: { user: cfg.user, pass: cfg.pass }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    });
    const info = await transport.sendMail({
      from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text, replyTo: mail.replyTo,
      attachments: (mail.attachments ?? []).map((a) => ({ filename: a.filename, content: Buffer.from(a.content), contentType: a.contentType })),
    });
    // "accepted" by the SMTP server is still not "delivered"; the delivery webhook moves it on.
    return { ok: true, providerId: info.messageId ?? null };
  } catch (e) {
    return { ok: false, error: `SMTP: ${e instanceof Error ? e.message : "could not send"}`.slice(0, 240) };
  }
}
