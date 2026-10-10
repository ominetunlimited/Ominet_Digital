"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, type StaffSupabase } from "@/lib/auth/guard";
import { resolveOthers, fetchTitles, type LinkableType } from "@/lib/related";

export type PlainResult = { ok: true } | { ok: false; error: string };
export type SearchResult = { type: LinkableType; id: string; title: string; subtitle: string };
export type AdminRelatedRow = { relationId: string; type: LinkableType; id: string; title: string };

const TABLE: Record<LinkableType, string> = { content: "content", book: "books", service: "services" };
const NOUN: Record<LinkableType, string> = { content: "Article", book: "Book", service: "Service" };

async function staffClient(): Promise<{ ok: true; supabase: StaffSupabase } | { ok: false; error: string }> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  return { ok: true, supabase: auth.supabase };
}

/** Type-ahead search across the three linkable tables, for the "Related" picker. */
export async function searchLinkable(query: string, excludeType: LinkableType, excludeId: string): Promise<SearchResult[]> {
  const staff = await staffClient();
  if (!staff.ok) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = staff.supabase;

  const [{ data: contentRows }, { data: bookRows }, { data: serviceRows }] = await Promise.all([
    supabase.from("content").select("id,title,status").ilike("title", `%${q}%`).limit(6),
    supabase.from("books").select("id,title,status").ilike("title", `%${q}%`).limit(6),
    supabase.from("services").select("id,title,status").ilike("title", `%${q}%`).limit(6),
  ]);

  const out: SearchResult[] = [];
  for (const r of contentRows ?? []) if (!(excludeType === "content" && excludeId === r.id)) out.push({ type: "content", id: r.id, title: r.title, subtitle: `${NOUN.content} · ${r.status}` });
  for (const r of bookRows ?? []) if (!(excludeType === "book" && excludeId === r.id)) out.push({ type: "book", id: r.id, title: r.title, subtitle: `${NOUN.book} · ${r.status}` });
  for (const r of serviceRows ?? []) if (!(excludeType === "service" && excludeId === r.id)) out.push({ type: "service", id: r.id, title: r.title, subtitle: `${NOUN.service} · ${r.status}` });
  return out.slice(0, 10);
}

/** Everything currently related to one item, for the admin panel's own list (includes drafts — staff bypasses RLS). */
export async function listRelated(sourceType: LinkableType, sourceId: string): Promise<AdminRelatedRow[]> {
  const staff = await staffClient();
  if (!staff.ok) return [];
  const supabase = staff.supabase;

  const others = await resolveOthers(supabase, sourceType, sourceId);
  if (others.length === 0) return [];
  const titles = await fetchTitles(supabase, others);
  return others.map((o) => ({ relationId: o.relationId, type: o.type, id: o.id, title: titles.get(`${o.type}:${o.id}`)?.title ?? "(deleted)" }));
}

export async function addRelated(sourceType: LinkableType, sourceId: string, targetType: LinkableType, targetId: string): Promise<PlainResult> {
  const staff = await staffClient();
  if (!staff.ok) return staff;
  if (sourceType === targetType && sourceId === targetId) return { ok: false, error: "An item can't be related to itself." };
  if (!sourceId) return { ok: false, error: "Save this item first, then relate it to others." };

  const supabase = staff.supabase;

  const { data: exists } = await supabase.from(TABLE[targetType]).select("id").eq("id", targetId).maybeSingle();
  if (!exists) return { ok: false, error: "That item couldn't be found." };

  const { data: dup } = await supabase
    .from("related_items")
    .select("id")
    .or(
      `and(source_type.eq.${sourceType},source_id.eq.${sourceId},target_type.eq.${targetType},target_id.eq.${targetId}),` +
        `and(source_type.eq.${targetType},source_id.eq.${targetId},target_type.eq.${sourceType},target_id.eq.${sourceId})`
    )
    .maybeSingle();
  if (dup) return { ok: false, error: "Already related." };

  const { error } = await supabase.from("related_items").insert({ source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeRelated(relationId: string): Promise<PlainResult> {
  const staff = await staffClient();
  if (!staff.ok) return staff;
  const supabase = staff.supabase;

  const { error } = await supabase.from("related_items").delete().eq("id", relationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
