"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase isn't configured yet." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
