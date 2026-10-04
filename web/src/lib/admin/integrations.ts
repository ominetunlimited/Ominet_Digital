import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { isMailgunConfigured } from "@/lib/mailgun";

export type IntegrationStatus = {
  name: string;
  state: "ok" | "warn" | "off";
  summary: string;
  detail?: string;
};

/**
 * Read-only health of the services the site depends on. Only ever reports
 * WHETHER something is configured (and, for Paystack, test vs live) — never
 * a key, token or secret. Credentials live in server environment variables.
 */
export async function getIntegrationStatus(): Promise<IntegrationStatus[]> {
  const out: IntegrationStatus[] = [];

  const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!paystackKey) out.push({ name: "Paystack (payments)", state: "off", summary: "Not configured", detail: "Set PAYSTACK_SECRET_KEY in Vercel to take payments." });
  else {
    const live = paystackKey.startsWith("sk_live_");
    const test = paystackKey.startsWith("sk_test_");
    out.push({
      name: "Paystack (payments)",
      state: live ? "ok" : "warn",
      summary: live ? "Configured — LIVE mode" : test ? "Configured — TEST mode (no real money)" : "Configured — key format not recognised",
      detail: `Callback URL: ${SITE_URL}/checkout/callback · Webhook URL: ${SITE_URL}/api/webhooks/paystack`,
    });
  }

  const tgToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const tgChat = Boolean(process.env.TELEGRAM_CHAT_ID);
  out.push({
    name: "Telegram alerts",
    state: tgToken && tgChat ? "ok" : "off",
    summary: tgToken && tgChat ? "Configured" : tgToken || tgChat ? "Half configured — needs both the bot token and chat ID" : "Not configured",
    detail: "Send a test from Admin → Notifications.",
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  out.push({
    name: "Supabase (database & storage)",
    state: supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "warn",
    summary: supabaseUrl ? `Connected to ${new URL(supabaseUrl).hostname}` : "Not configured",
    detail: process.env.SUPABASE_SERVICE_ROLE_KEY ? undefined : "The server-side service key is missing — payments, bookings and downloads need it.",
  });

  out.push({
    name: "Google AdSense",
    state: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ? "ok" : "off",
    summary: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ? "Publisher ID set" : "Not set up — only direct ads can run",
    detail: "Earnings are only visible in your AdSense account.",
  });

  let subscribers: number | null = null;
  const supabase = await createClient();
  if (supabase) {
    const { count } = await supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true });
    subscribers = count ?? null;
  }
  const mailgunReady = await isMailgunConfigured();
  out.push({
    name: "Newsletter (Mailgun)",
    state: mailgunReady ? "ok" : "warn",
    summary: `${subscribers === null ? "Subscribers stored here" : `${subscribers} subscriber${subscribers === 1 ? "" : "s"}`} · ${mailgunReady ? "sending is connected" : "sending not set up"}`,
    detail: mailgunReady ? "Manage in Admin → Newsletter." : "Set up Mailgun in Admin → Newsletter — no Vercel access needed.",
  });

  out.push({ name: "Site address", state: SITE_URL.startsWith("https://") ? "ok" : "warn", summary: SITE_URL, detail: "Set by NEXT_PUBLIC_SITE_URL in Vercel." });

  return out;
}
