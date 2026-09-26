import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_COOKIE_OPTIONS, supabaseConfigured } from "./env";

/** Browser-side Supabase client, for client components (e.g. the login form). */
export function createClient() {
  if (!supabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { cookieOptions: AUTH_COOKIE_OPTIONS });
}
