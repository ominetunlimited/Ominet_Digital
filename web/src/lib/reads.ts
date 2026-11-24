import { createClient as createAnon } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";

export type ReadKind = "blog" | "articles" | "books";

/** Cookie-less client, so pages that show counts stay statically cacheable. */
const anon = () => createAnon(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

/** Read counts for several slugs of one kind. Missing rows count as zero. Never throws. */
export async function getReadCounts(kind: ReadKind, slugs: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!supabaseConfigured || slugs.length === 0) return out;
  try {
    const { data } = await anon().from("read_counts").select("slug,reads").eq("kind", kind).in("slug", slugs.slice(0, 200));
    for (const r of data ?? []) out[r.slug as string] = Number(r.reads) || 0;
  } catch {
    /* counts are decoration; never break a page over them */
  }
  return out;
}

export async function getReadCount(kind: ReadKind, slug: string): Promise<number> {
  return (await getReadCounts(kind, [slug]))[slug] ?? 0;
}

export function formatReads(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1000000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}
