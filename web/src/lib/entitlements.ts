import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/** Is the current signed-in reader entitled to this paid content item? */
export async function hasEntitlement(contentId: string | undefined): Promise<boolean> {
  if (!contentId || !supabaseConfigured) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return false;
  const { data } = await supabase!
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .maybeSingle();
  return Boolean(data);
}

export async function getCurrentUser() {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  return user;
}
