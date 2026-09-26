export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Session cookies only travel over https in production (plain http on localhost still works in dev). */
export const AUTH_COOKIE_OPTIONS = { secure: process.env.NODE_ENV === "production" } as const;

/**
 * False until a real Supabase project is wired up (env vars set). Data
 * readers fall back to the bundled mock fixtures while this is false —
 * see project/README.md's own allowance for "development fixtures only".
 */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
