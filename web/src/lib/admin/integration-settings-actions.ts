"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function adminClient() {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return { ok: true as const, supabase: auth.supabase, user: { id: auth.userId } };
}

export type MailgunStatus = { configured: boolean; domain: string; region: "us" | "eu"; apiKeyHint: string };

/** Admin-only. Never returns the full API key — just enough to confirm one is stored. */
export async function getMailgunStatus(): Promise<MailgunStatus | { error: string }> {
  const check = await adminClient();
  if (!check.ok) return { error: check.error };
  const { data } = await check.supabase.from("integration_settings").select("value").eq("key", "mailgun").maybeSingle();
  const v = (data?.value ?? {}) as { apiKey?: string; domain?: string; region?: string };
  return {
    configured: Boolean(v.apiKey && v.domain),
    domain: v.domain ?? "",
    region: v.region === "eu" ? "eu" : "us",
    apiKeyHint: v.apiKey ? `•••• ${v.apiKey.slice(-4)}` : "",
  };
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** apiKey left blank keeps whatever key is already stored (so re-saving domain/region doesn't require re-pasting the key). */
export async function saveMailgunConfig(input: { apiKey: string; domain: string; region: "us" | "eu" }): Promise<ActionResult> {
  const check = await adminClient();
  if (!check.ok) return check;

  const domain = input.domain.trim().toLowerCase();
  if (!DOMAIN_RE.test(domain)) return { ok: false, error: "Enter the sending domain exactly as verified in Mailgun, e.g. mg.ominetdigital.com.ng" };
  const region = input.region === "eu" ? "eu" : "us";

  let apiKey = input.apiKey.trim();
  if (!apiKey) {
    const { data } = await check.supabase.from("integration_settings").select("value").eq("key", "mailgun").maybeSingle();
    apiKey = ((data?.value as { apiKey?: string } | null)?.apiKey ?? "").trim();
  }
  if (!apiKey) return { ok: false, error: "Enter your Mailgun private API key." };

  const { error } = await check.supabase
    .from("integration_settings")
    .upsert({ key: "mailgun", value: { apiKey, domain, region }, updated_by: check.user?.id ?? null, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/newsletter");
  return { ok: true };
}

export async function clearMailgunConfig(): Promise<ActionResult> {
  const check = await adminClient();
  if (!check.ok) return check;
  const { error } = await check.supabase.from("integration_settings").delete().eq("key", "mailgun");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  return { ok: true };
}
