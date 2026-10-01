"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type EcosystemApp = {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  visibility: "private" | "public";
  displayOrder: number;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

async function staffClient() {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase isn't configured yet." };
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { ok: false as const, error: "Not allowed." };
  return { ok: true as const, supabase };
}

export async function listEcosystemApps(): Promise<EcosystemApp[]> {
  const check = await staffClient();
  if (!check.ok) return [];
  const { data } = await check.supabase
    .from("ecosystem_apps")
    .select("id,title,slug,description,url,visibility,display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description ?? "",
    url: r.url,
    visibility: r.visibility,
    displayOrder: r.display_order,
  }));
}

export type SaveInput = { id?: string; title: string; description: string; url: string; visibility: "private" | "public" };

export async function saveEcosystemApp(input: SaveInput): Promise<ActionResult> {
  const check = await staffClient();
  if (!check.ok) return check;
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Enter a name." };
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Enter the full https:// address." };

  const row = {
    title,
    description: input.description.trim() || null,
    url,
    visibility: input.visibility,
  };

  const { error } = input.id
    ? await check.supabase.from("ecosystem_apps").update(row).eq("id", input.id)
    : await check.supabase.from("ecosystem_apps").insert({ ...row, slug: `${slugify(title)}-${Date.now().toString(36)}` });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/ecosystem");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeEcosystemApp(id: string): Promise<ActionResult> {
  const check = await staffClient();
  if (!check.ok) return check;
  const { error } = await check.supabase.from("ecosystem_apps").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ecosystem");
  revalidatePath("/", "layout");
  return { ok: true };
}
