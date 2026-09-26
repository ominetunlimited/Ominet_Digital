// SERVER ONLY. The bot token lives in TELEGRAM_BOT_TOKEN and must never
// reach the browser: this file is only imported from server actions, route
// handlers and server components. Nothing here is exported to a client
// component, and no value from it is ever put in a response body.

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/seo";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const telegramConfigured = Boolean(TOKEN && CHAT_ID);

const MAX_PER_MINUTE = 20; // ceiling across all alerts, so a flood can't become a Telegram flood
const ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 8_000;

export type AlertEvent =
  | "booking"
  | "comment"
  | "purchase"
  | "payment_failed"
  | "newsletter"
  | "security"
  | "test";

/** Telegram HTML mode: only these three characters need escaping. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Strip anything that looks like our secrets from text we might log or show. */
function redact(s: string): string {
  let out = s;
  if (TOKEN) out = out.split(TOKEN).join("[redacted]");
  return out.replace(/bot\d{5,}:[A-Za-z0-9_-]{20,}/g, "bot[redacted]").slice(0, 300);
}

export function adminLink(path: string): string {
  return `${SITE_URL}${path}`;
}

async function log(eventType: string, dedupeKey: string | undefined, status: string, error?: string) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("notification_log")
    .insert({ event_type: eventType, dedupe_key: dedupeKey ?? null, status, error: error ? redact(error) : null })
    .then(() => {}, () => {});
}

async function postToTelegram(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.ok) return { ok: true };

      const body = (await res.json().catch(() => ({}))) as { description?: string; parameters?: { retry_after?: number } };
      lastError = `HTTP ${res.status}: ${body.description ?? "no description"}`;

      // 4xx other than 429 means our request/credentials are wrong — retrying can't help.
      if (res.status !== 429 && res.status >= 400 && res.status < 500) return { ok: false, error: lastError };
      const wait = res.status === 429 ? Math.min((body.parameters?.retry_after ?? 1) * 1000, 4000) : 500 * attempt;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, wait));
    } catch (e) {
      lastError = e instanceof Error ? e.message : "network error";
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return { ok: false, error: lastError };
}

/**
 * Send an alert. NEVER throws and never blocks a caller's success: a failed
 * or unconfigured Telegram must not turn a saved booking into a failed one.
 * `dedupeKey` makes it idempotent (same key => sent at most once).
 * Keep `lines` to the minimum needed to act — no emails, phone numbers,
 * message bodies, payment details or tokens.
 */
export type AlertOutcome = { status: "sent" | "failed" | "duplicate" | "rate_limited" | "not_configured"; error?: string };

export async function sendAlert(event: AlertEvent, title: string, lines: string[], opts: { dedupeKey?: string; link?: string } = {}): Promise<AlertOutcome> {
  try {
    if (!telegramConfigured) {
      await log(event, undefined, "not_configured");
      return { status: "not_configured" };
    }
    const admin = createAdminClient();

    // Idempotency: claim the key first. A duplicate key means someone already sent (or is sending) it.
    if (opts.dedupeKey && admin) {
      const { error } = await admin
        .from("notification_log")
        .insert({ event_type: event, dedupe_key: opts.dedupeKey, status: "skipped", error: "claimed" });
      if (error) return { status: "duplicate" }; // unique violation => already handled
    }

    if (admin) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await admin.from("notification_log").select("id", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since);
      if ((count ?? 0) >= MAX_PER_MINUTE) {
        await log(event, undefined, "rate_limited");
        return { status: "rate_limited" };
      }
    }

    const text = [`<b>${esc(title)}</b>`, ...lines.map(esc), opts.link ? esc(opts.link) : ""].filter(Boolean).join("\n").slice(0, 3500);
    const result = await postToTelegram(text);

    if (admin && opts.dedupeKey) {
      await admin
        .from("notification_log")
        .update({ status: result.ok ? "sent" : "failed", error: result.ok ? null : redact(result.error) })
        .eq("dedupe_key", opts.dedupeKey)
        .then(() => {}, () => {});
    } else {
      await log(event, undefined, result.ok ? "sent" : "failed", result.ok ? undefined : result.error);
    }
    return result.ok ? { status: "sent" } : { status: "failed", error: redact(result.error) };
  } catch (e) {
    const error = redact(e instanceof Error ? e.message : "unexpected error");
    await log(event, undefined, "failed", error);
    return { status: "failed", error };
  }
}

/**
 * Fire an alert after the response has been sent, so it can't slow the
 * user's action down. Falls back to running inline if `after` isn't
 * available in the current context.
 */
export function queueAlert(event: AlertEvent, title: string, lines: string[], opts: { dedupeKey?: string; link?: string } = {}): void {
  const run = () => sendAlert(event, title, lines, opts);
  try {
    after(run);
  } catch {
    void run();
  }
}
