"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeFromPath, normalizeToPath, checkRedirectLoop } from "@/lib/redirect-validate";

export type RedirectInput = { id?: string; fromPath: string; toPath: string; statusCode: number; active: boolean };
export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };

type Db = NonNullable<Awaited<ReturnType<typeof createClient>>>;

async function staffClient(): Promise<{ ok: true; supabase: Db } | { ok: false; error: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { ok: false, error: "Not allowed." };
  return { ok: true, supabase };
}

function refresh() {
  revalidatePath("/admin/redirects");
}

const friendly = (message: string) =>
  /redirects/.test(message) && /(does not exist|schema cache)/i.test(message)
    ? "The redirects table isn't ready yet — run migration 0019_redirects.sql in the Supabase SQL Editor."
    : /duplicate key/i.test(message)
      ? "A redirect from that address already exists."
      : message;

export async function saveRedirect(input: RedirectInput): Promise<SaveResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const from = normalizeFromPath(input.fromPath);
  if (!from.ok) return from;
  if (input.statusCode !== 301 && input.statusCode !== 302) return { ok: false, error: "Choose 301 (permanent) or 302 (temporary)." };
  const to = normalizeToPath(input.toPath);
  if (!to.ok) return to;

  // Loop check needs every OTHER currently-active redirect — never the row
  // being edited itself, or it would always "find itself".
  let others = supabase.from("redirects").select("from_path,to_path").eq("active", true).eq("archived", false);
  if (input.id) others = others.neq("id", input.id);
  const { data: existing, error: listError } = await others;
  if (listError) return { ok: false, error: friendly(listError.message) };
  const loopError = checkRedirectLoop((existing ?? []).map((r) => ({ fromPath: r.from_path, toPath: r.to_path })), from.path, to.path);
  if (loopError) return { ok: false, error: loopError };

  const row = { from_path: from.path, to_path: to.path, status_code: input.statusCode, active: input.active, updated_at: new Date().toISOString() };

  if (input.id) {
    const { error } = await supabase.from("redirects").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refresh();
    return { ok: true, id: input.id };
  }
  const { data, error } = await supabase.from("redirects").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save the redirect.") };
  refresh();
  return { ok: true, id: data.id };
}

export async function setRedirectActive(id: string, active: boolean): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("redirects").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function setRedirectArchived(id: string, archived: boolean): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("redirects").update({ archived, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function deleteRedirect(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("redirects").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}
