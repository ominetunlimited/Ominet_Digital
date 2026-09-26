"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function subscribeToNewsletter(email: string): Promise<ActionResult> {
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!supabaseConfigured) return { ok: false, error: "Newsletter signup isn't configured yet." };

  const supabase = await createClient();
  const { error } = await supabase!.from("newsletter_subscribers").insert({ email });
  if (error) {
    if (error.code === "23505") return { ok: true, message: "You're already subscribed." };
    return { ok: false, error: error.message };
  }
  await supabase!.from("analytics_events").insert({ event_type: "signup", metadata: { kind: "newsletter" } });
  return { ok: true, message: "Subscribed — thanks!" };
}
