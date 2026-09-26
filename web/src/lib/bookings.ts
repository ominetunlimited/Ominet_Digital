"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export type BookingInput = {
  serviceId: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string; // yyyy-mm-dd or ""
  preferredTime: string;
  message: string;
  website: string; // honeypot — real people leave this empty
};

export type BookingResult = { ok: true; reference: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PER_GUEST_PER_HOUR = 5;
const PER_EMAIL_PER_DAY = 3;

/**
 * Guest booking — no account. Uses the service-role client because the
 * bookings table has no public policies at all (it holds names, emails and
 * phone numbers); everything a browser could tamper with is re-validated here.
 */
export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  // Bots fill every field; a person never sees this one. Pretend success so
  // the bot learns nothing.
  if (input.website) return { ok: true, reference: "RECEIVED" };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const message = input.message.trim();
  const preferredTime = input.preferredTime.trim();

  if (!name || name.length > 120) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: "Please enter a valid email address." };
  if (phone.length > 40) return { ok: false, error: "That phone number looks too long." };
  if (message.length > 2000) return { ok: false, error: "Please keep your message under 2000 characters." };
  if (preferredTime.length > 40) return { ok: false, error: "That time looks too long." };

  let preferredDate: string | null = null;
  if (input.preferredDate) {
    if (!DATE_RE.test(input.preferredDate) || Number.isNaN(Date.parse(input.preferredDate))) {
      return { ok: false, error: "Please pick a valid date." };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (input.preferredDate < today) return { ok: false, error: "Please pick a date that isn't in the past." };
    preferredDate = input.preferredDate;
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Booking isn't available right now. Please email ominetmedia@gmail.com." };

  const { data: service } = await admin
    .from("services")
    .select("id,title,status,booking_enabled")
    .eq("id", input.serviceId)
    .maybeSingle();
  if (!service || service.status !== "published" || !service.booking_enabled) {
    return { ok: false, error: "This service isn't taking bookings right now." };
  }

  const guestKey = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [byGuest, byEmail] = await Promise.all([
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
  ]);
  if ((byGuest.count ?? 0) >= PER_GUEST_PER_HOUR || (byEmail.count ?? 0) >= PER_EMAIL_PER_DAY) {
    return { ok: false, error: "You've sent several requests already. Please wait a while, or email ominetmedia@gmail.com." };
  }

  const { data, error } = await admin
    .from("bookings")
    .insert({
      service_id: service.id,
      service_title: service.title,
      name,
      email,
      phone: phone || null,
      preferred_date: preferredDate,
      preferred_time: preferredTime || null,
      message: message || null,
      guest_key: guestKey,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "We couldn't save your request. Please try again, or email ominetmedia@gmail.com." };

  // Feeds the Analytics dashboard; a logging failure must never fail the booking.
  await admin.from("analytics_events").insert({ event_type: "booking", metadata: { service_id: service.id } }).then(() => {}, () => {});

  revalidatePath("/admin/bookings");
  return { ok: true, reference: (data.id as string).slice(0, 8).toUpperCase() };
}
