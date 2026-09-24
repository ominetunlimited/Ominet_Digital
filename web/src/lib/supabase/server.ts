import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "./env";

/**
 * Server-side Supabase client for Server Components / Server Actions /
 * Route Handlers. Reads and writes the session via Next's cookie jar per
 * the standard @supabase/ssr pattern. Returns null when no project is
 * configured yet — callers fall back to mock content in that case.
 */
export async function createClient() {
  if (!supabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render (no response to write
          // cookies to) — the middleware refreshes the session instead.
        }
      },
    },
  });
}
