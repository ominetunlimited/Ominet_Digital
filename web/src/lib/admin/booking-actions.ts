"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guard";

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";
export type ActionResult = { ok: true } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Enforced at the app layer by requireStaff() and again by RLS
// (bookings_staff_all) — a non-staff caller updates/deletes zero rows, which
// we surface as an error instead of a silent "success".
export async function setBookingStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const { data, error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Not allowed, or that booking no longer exists." };
  revalidatePath("/admin/bookings");
  return { ok: true };
}

/** Reschedule (sets the confirmed slot and confirms) and/or save internal notes. */
export async function updateBooking(
  id: string,
  patch: { confirmedDate?: string; confirmedTime?: string; internalNotes?: string; confirm?: boolean }
): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.confirmedDate !== undefined) {
    if (patch.confirmedDate && !DATE_RE.test(patch.confirmedDate)) return { ok: false, error: "That date isn't valid." };
    row.confirmed_date = patch.confirmedDate || null;
  }
  if (patch.confirmedTime !== undefined) row.confirmed_time = patch.confirmedTime.trim().slice(0, 40) || null;
  if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes.slice(0, 4000) || null;
  if (patch.confirm) row.status = "confirmed";

  const { data, error } = await supabase.from("bookings").update(row).eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Not allowed, or that booking no longer exists." };
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = auth.supabase;
  const { data, error } = await supabase.from("bookings").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Not allowed, or that booking no longer exists." };
  revalidatePath("/admin/bookings");
  return { ok: true };
}
