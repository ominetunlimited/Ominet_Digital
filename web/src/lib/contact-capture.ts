import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Saves a person who contacted us into the newsletter table so staff can see everyone in one place.
 * Consent is respected: a contact is stored as 'contact' (never mailed by a campaign) unless they ticked the
 * newsletter opt-in, in which case they become 'subscribed'. Someone who has unsubscribed is never re-subscribed.
 * Failures are swallowed on purpose: an enquiry must never fail because this list could not be updated.
 */
export async function saveContactToList(
  admin: SupabaseClient,
  c: { email: string; name?: string; phone?: string; source: string; optIn?: boolean },
): Promise<void> {
  try {
    const email = c.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;
    const now = new Date().toISOString();
    const { data: existing } = await admin.from("newsletter_subscribers").select("id,status,name,phone").eq("email", email).maybeSingle();
    if (!existing) {
      await admin.from("newsletter_subscribers").insert({
        email, name: c.name?.slice(0, 120) || null, phone: c.phone?.slice(0, 40) || null, source: c.source,
        status: c.optIn ? "subscribed" : "contact", last_contact_at: now,
      });
      return;
    }
    const patch: Record<string, unknown> = { last_contact_at: now };
    if (!existing.name && c.name) patch.name = c.name.slice(0, 120);
    if (!existing.phone && c.phone) patch.phone = c.phone.slice(0, 40);
    if (c.optIn && existing.status === "contact") patch.status = "subscribed";
    await admin.from("newsletter_subscribers").update(patch).eq("id", existing.id);
  } catch {
    /* best effort */
  }
}
