import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "@/lib/supabase/env";

export type SelectedWork = { id: string; label: string; yearLabel: string; displayOrder: number; active: boolean };

type Row = { id: string; label: string; year_label: string; display_order: number; active: boolean };

export function mapWork(r: Row): SelectedWork {
  return { id: r.id, label: r.label, yearLabel: r.year_label, displayOrder: r.display_order, active: r.active };
}

/**
 * Visible entries for the public About page. Cookie-less client so the page
 * can stay static; any failure quietly means "nothing to show".
 */
export async function getSelectedWork(): Promise<SelectedWork[]> {
  if (!supabaseConfigured) return [];
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from("selected_work").select("*").eq("active", true).order("display_order");
    if (error || !data) return [];
    return (data as Row[]).map(mapWork);
  } catch {
    return [];
  }
}
