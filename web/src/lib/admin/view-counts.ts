import type { StaffSupabase } from "@/lib/auth/guard";

/**
 * Total first-party page views per public path, from the analytics table (counted since tracking began).
 * Returns an empty map if the lookup fails, so a list page never breaks because of a missing count.
 */
export async function getViewCounts(db: StaffSupabase, paths: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  try {
    const { data, error } = await db.rpc("page_view_counts", { p_paths: unique });
    if (error || !data) return {};
    const out: Record<string, number> = {};
    for (const row of data as { path: string; views: number | string }[]) out[row.path] = Number(row.views);
    return out;
  } catch {
    return {};
  }
}
