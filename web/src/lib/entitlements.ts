import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { readAnonKey } from "@/lib/anon-key";

/** Is the current reader entitled to this paid content item — whether
 *  signed in, or a guest who bought it in this same browser? */
export async function hasEntitlement(contentId: string | undefined): Promise<boolean> {
  if (!contentId || !supabaseConfigured) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (user) {
    const { data } = await supabase!
      .from("entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .maybeSingle();
    return Boolean(data);
  }

  const anonKey = await readAnonKey();
  if (!anonKey) return false;
  const { data } = await supabase!
    .from("entitlements")
    .select("id")
    .eq("guest_key", anonKey)
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
