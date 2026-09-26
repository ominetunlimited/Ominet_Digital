import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { readAnonKey } from "@/lib/anon-key";

type Target = { column: "content_id" | "book_id"; id: string };

/**
 * Does the current reader own this item — signed in, or a guest who bought it
 * in this same browser? Guest lookups use the service role against the
 * reader's own httpOnly cookie: guest rows are not readable through the
 * public API at all (they carry buyer emails).
 */
async function hasEntitlementTo({ column, id }: Target): Promise<boolean> {
  if (!id || !supabaseConfigured) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (user) {
    const { data } = await supabase!.from("entitlements").select("id").eq("user_id", user.id).eq(column, id).maybeSingle();
    return Boolean(data);
  }

  const anonKey = await readAnonKey();
  if (!anonKey) return false;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data } = await admin.from("entitlements").select("id").eq("guest_key", anonKey).eq(column, id).maybeSingle();
  return Boolean(data);
}

/** Is the current reader entitled to this paid content item? */
export async function hasEntitlement(contentId: string | undefined): Promise<boolean> {
  return contentId ? hasEntitlementTo({ column: "content_id", id: contentId }) : false;
}

/** Has the current reader bought this book (from this browser or their account)? */
export async function hasBookEntitlement(bookId: string | undefined): Promise<boolean> {
  return bookId ? hasEntitlementTo({ column: "book_id", id: bookId }) : false;
}

export async function getCurrentUser() {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  return user;
}
