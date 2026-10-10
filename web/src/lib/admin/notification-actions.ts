"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";
import { sendAlert } from "@/lib/notify/telegram";

export type TestResult = { ok: true; message: string } | { ok: false; error: string };

/** Staff-only: proves the bot token + chat id actually work end to end. */
export async function sendTestAlert(): Promise<TestResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const outcome = await sendAlert("test", "Ominet Digital test alert", ["If you can read this, Telegram alerts are working."], {
    dedupeKey: `test:${Date.now()}`,
  });
  revalidatePath("/admin/notifications");

  switch (outcome.status) {
    case "sent":
      return { ok: true, message: "Sent — check your Telegram chat." };
    case "not_configured":
      return { ok: false, error: "TELEGRAM NOT CONNECTED — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID." };
    case "rate_limited":
      return { ok: false, error: "Too many alerts in the last minute — try again shortly." };
    default:
      return { ok: false, error: outcome.error ?? "Telegram rejected the message." };
  }
}
