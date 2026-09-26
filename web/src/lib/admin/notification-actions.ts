"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendAlert } from "@/lib/notify/telegram";

export type TestResult = { ok: true; message: string } | { ok: false; error: string };

/** Staff-only: proves the bot token + chat id actually work end to end. */
export async function sendTestAlert(): Promise<TestResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  // Never trust the browser about who is calling — ask the database.
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { ok: false, error: "Not allowed." };

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
