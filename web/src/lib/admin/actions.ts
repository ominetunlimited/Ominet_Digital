"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit, recentFailedLogins, clientIp } from "@/lib/audit";

const MAX_FAILS_PER_EMAIL_AND_IP = 8;
const MAX_FAILS_PER_IP = 25;

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (user) await logAudit({ action: "auth.logout", entityType: "auth", label: user.email ?? undefined, actor: { id: user.id, email: user.email }, metadata: { ip: await clientIp() } });
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase isn't configured yet." };

  const cleanEmail = email.trim().toLowerCase().slice(0, 200);
  const ip = await clientIp();

  // Guessing passwords gets slower for the guesser only: the limit is per
  // email+address (and per address overall), so a stranger hammering an
  // admin's email can't lock the real admin out from their own address.
  const fails = await recentFailedLogins(cleanEmail, ip);
  if (fails.forEmailAndIp >= MAX_FAILS_PER_EMAIL_AND_IP || fails.forIp >= MAX_FAILS_PER_IP) {
    await logAudit({ action: "auth.login_blocked", entityType: "auth", label: cleanEmail, metadata: { email: cleanEmail, ip } });
    return { ok: false as const, error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (error || !data.user) {
    await logAudit({ action: "auth.login_failed", entityType: "auth", label: cleanEmail, metadata: { email: cleanEmail, ip } });
    return { ok: false as const, error: error?.message ?? "Sign-in failed." };
  }

  await logAudit({ action: "auth.login", entityType: "auth", label: cleanEmail, actor: { id: data.user.id, email: data.user.email }, metadata: { ip } });
  return { ok: true as const };
}
