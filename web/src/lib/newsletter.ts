"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { queueAlert, adminLink } from "@/lib/notify/telegram";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function subscribeToNewsletter(email: string): Promise<ActionResult> {
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!supabaseConfigured) return { ok: false, error: "Newsletter signup isn't configured yet." };

  const supabase = await createClient();
  const { error } = await supabase!.from("newsletter_subscribers").insert({ email });
  if (error) {
    if (error.code === "23505") {
      // Already on the list. If they were only a saved contact (from an enquiry), a deliberate signup is consent, so upgrade them.
      try {
        const admin = createAdminClient();
        const e = email.trim().toLowerCase();
        const { data: upgraded } = await admin!.from("newsletter_subscribers").update({ status: "subscribed" }).eq("email", e).eq("status", "contact").select("id");
        if (upgraded && upgraded.length > 0) return { ok: true, message: "Subscribed — thanks!" };
      } catch { /* fall through */ }
      return { ok: true, message: "You're already subscribed." };
    }
    return { ok: false, error: error.message };
  }
  await supabase!.from("analytics_events").insert({ event_type: "signup", metadata: { kind: "newsletter" } });
  queueAlert("newsletter", "New newsletter subscriber", [], { link: adminLink("/admin/newsletter") });
  return { ok: true, message: "Subscribed — thanks!" };
}
