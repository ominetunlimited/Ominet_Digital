"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNewsletterBatch, isMailgunConfigured } from "@/lib/mailgun";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function staffClient() {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Supabase isn't configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { ok: false as const, error: "Not allowed." };
  return { ok: true as const, supabase, user };
}

const CHUNK = 1000; // Mailgun's own per-call recipient limit

/** A one-recipient send to the signed-in staff member's own address, to proof-read before it goes to real subscribers. */
export async function sendNewsletterTest(subject: string, html: string): Promise<ActionResult> {
  const check = await staffClient();
  if (!check.ok) return check;
  if (!check.user?.email) return { ok: false, error: "Your account has no email to send the test to." };
  if (!subject.trim() || !html.trim()) return { ok: false, error: "Write a subject and a body first." };
  if (!(await isMailgunConfigured())) return { ok: false, error: "Mailgun isn't configured yet — set it up above." };

  const result = await sendNewsletterBatch(`[Test] ${subject}`, html, [{ email: check.user.email, unsubscribeToken: "test" }]);
  if (!result.ok) return result;
  return { ok: true, message: `Test sent to ${check.user.email}.` };
}

/** Sends to every currently-subscribed reader and records the campaign. Each recipient gets their own unsubscribe link. */
export async function sendNewsletterCampaign(subject: string, html: string): Promise<ActionResult> {
  const check = await staffClient();
  if (!check.ok) return check;
  const subjectTrimmed = subject.trim();
  if (!subjectTrimmed || !html.trim()) return { ok: false, error: "Write a subject and a body first." };
  if (!(await isMailgunConfigured())) return { ok: false, error: "Mailgun isn't configured yet — set it up above." };

  const { data: subscribers, error: fetchError } = await check.supabase
    .from("newsletter_subscribers")
    .select("email,unsubscribe_token")
    .eq("status", "subscribed");
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!subscribers || subscribers.length === 0) return { ok: false, error: "No subscribed readers to send to." };

  const { data: campaign, error: insertError } = await check.supabase
    .from("newsletter_campaigns")
    .insert({ subject: subjectTrimmed, body_html: html, status: "sending", recipient_count: subscribers.length, sent_by: check.user?.id ?? null })
    .select("id")
    .single();
  if (insertError || !campaign) return { ok: false, error: insertError?.message ?? "Couldn't start the campaign." };

  const recipients = subscribers.map((s) => ({ email: s.email, unsubscribeToken: s.unsubscribe_token as string }));
  let sentCount = 0;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const batch = recipients.slice(i, i + CHUNK);
    const result = await sendNewsletterBatch(subjectTrimmed, html, batch);
    if (!result.ok) {
      await check.supabase.from("newsletter_campaigns").update({ status: "failed", error: result.error }).eq("id", campaign.id);
      revalidatePath("/admin/newsletter");
      return { ok: false, error: `Sent to ${sentCount} of ${recipients.length} before this failed: ${result.error}` };
    }
    sentCount += batch.length;
  }

  await check.supabase.from("newsletter_campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", campaign.id);
  revalidatePath("/admin/newsletter");
  return { ok: true, message: `Sent to ${sentCount} subscriber${sentCount === 1 ? "" : "s"}.` };
}
