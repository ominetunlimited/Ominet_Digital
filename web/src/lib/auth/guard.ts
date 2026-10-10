import { createClient } from "@/lib/supabase/server";

/**
 * The single, enforced authorization gate for every admin server action.
 *
 * Why this exists: RLS is the real data boundary (a non-staff caller can't
 * write a protected row even if they reach the action), but RLS alone means a
 * forgotten or mis-scoped policy is the ONLY thing standing between a logged-in
 * low-privilege user and an admin write. This guard adds a consistent, explicit
 * app-layer role check on top — defence in depth — so every privileged action
 * fails closed and loudly for a non-staff caller, and future actions inherit
 * the same protection by importing one helper instead of re-implementing it.
 *
 * `requireStaff`  → any staff role (super_admin, admin, editor, author).
 * `requireAdmin`  → only super_admin / admin (money, integrations, settings).
 *
 * Both mirror the database's own is_staff()/is_admin() predicates, so the
 * app-layer decision can never disagree with what RLS will allow.
 */

type Db = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** The server Supabase client type, so callers can name it without re-deriving it. */
export type StaffSupabase = Db;

export type GuardResult =
  | { ok: true; supabase: Db; userId: string; email: string | null }
  | { ok: false; error: string };

async function gate(predicate: "is_staff" | "is_admin"): Promise<GuardResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase isn't configured yet." };

  // getUser() re-validates the JWT with the auth server (not just the cookie),
  // so a forged/expired token can't sneak a role check through.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in." };

  const { data: allowed } = await supabase.rpc(predicate);
  if (!allowed) {
    return {
      ok: false,
      error: predicate === "is_admin" ? "Only admins can do this." : "Not allowed.",
    };
  }

  return { ok: true, supabase, userId: user.id, email: user.email ?? null };
}

/** Require ANY staff role. Use for ordinary content/moderation actions. */
export function requireStaff(): Promise<GuardResult> {
  return gate("is_staff");
}

/** Require super_admin or admin. Use for settings, integrations and anything money-adjacent. */
export function requireAdmin(): Promise<GuardResult> {
  return gate("is_admin");
}
