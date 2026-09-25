"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { SITE_URL } from "@/lib/seo";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Sends a Supabase magic-link/OTP email so a reader can sign in without a
 * password. Shared by the paywall, likes and comments — anywhere a reader
 * needs an identity without a full account-creation flow.
 */
export async function sendLoginLink(email: string, next: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: false, error: "Sign-in isn't configured yet." };
  const supabase = await createClient();
  const { error } = await supabase!.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Check your email for a sign-in link." };
}
