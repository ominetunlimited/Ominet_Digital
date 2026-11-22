"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, type StaffSupabase } from "@/lib/auth/guard";

export type WorkInput = { id?: string; label: string; yearLabel: string; active: boolean };
export type WorkResult = { ok: true; id: string } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };

async function staffClient(): Promise<{ ok: true; supabase: StaffSupabase } | { ok: false; error: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  return { ok: true, supabase: auth.supabase };
}

function refreshPublic() {
  revalidatePath("/admin/about-work");
  revalidatePath("/founder");
}

const friendly = (message: string) =>
  /selected_work/.test(message) && /(does not exist|schema cache)/i.test(message)
    ? "The selected_work table doesn't exist yet — run migration 0015_selected_work.sql in the Supabase SQL Editor."
    : message;

export async function saveSelectedWork(input: WorkInput): Promise<WorkResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const label = input.label.trim();
  const yearLabel = input.yearLabel.trim();
  if (!label || label.length > 200) return { ok: false, error: "Enter what this entry is (up to 200 characters)." };
  if (yearLabel.length > 40) return { ok: false, error: "Keep the year or dates under 40 characters." };

  const row = { label, year_label: yearLabel, active: input.active, updated_at: new Date().toISOString() };

  if (input.id) {
    const { error } = await supabase.from("selected_work").update(row).eq("id", input.id);
    if (error) return { ok: false, error: friendly(error.message) };
    refreshPublic();
    return { ok: true, id: input.id };
  }

  const { data: last } = await supabase.from("selected_work").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("selected_work")
    .insert({ ...row, display_order: (last?.display_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: friendly(error?.message ?? "Couldn't save the entry.") };
  refreshPublic();
  return { ok: true, id: data.id };
}

export async function deleteSelectedWork(id: string): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("selected_work").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refreshPublic();
  return { ok: true };
}

export async function reorderSelectedWork(ids: string[]): Promise<PlainResult> {
  const auth = await staffClient();
  if (!auth.ok) return auth;
  for (let i = 0; i < ids.length; i++) {
    const { error } = await auth.supabase.from("selected_work").update({ display_order: i }).eq("id", ids[i]);
    if (error) return { ok: false, error: friendly(error.message) };
  }
  refreshPublic();
  return { ok: true };
}
