export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until a real Supabase project is wired up (env vars set). Data
 * readers fall back to the bundled mock fixtures while this is false —
 * see project/README.md's own allowance for "development fixtures only".
 */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
