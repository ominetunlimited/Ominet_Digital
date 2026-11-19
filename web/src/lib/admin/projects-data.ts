import { createClient } from "@/lib/supabase/server";
import { STAGE_LABEL, type Stage } from "@/lib/workflow";
import { formatMoney } from "@/lib/money";

export type ProjectRow = {
  id: string; title: string; service: string; client: string; email: string; stage: Stage; bookingRef: string | null; enquiryRef: string | null;
  currency: string | null; agreedCents: number; paidCents: number; startDate: string | null; completionDate: string | null; createdAt: string;
};

export const ACTIVE_STAGES: Stage[] = ["booking_confirmed", "in_progress", "awaiting_review"];
const projectTitle = (b: { details: Record<string, unknown> | null; service_title: string }) =>
  typeof b.details?.projectTitle === "string" && b.details.projectTitle ? (b.details.projectTitle as string) : b.service_title;

/** One row per booking, with the agreed figure from its accepted quotation and money actually recorded. */
export async function loadProjectRows(): Promise<{ rows: ProjectRow[]; phones: Map<string, string> }> {
  const supabase = await createClient();
  if (!supabase) return { rows: [], phones: new Map() };
  const { data: bookings } = await supabase.from("bookings")
    .select("id,name,email,phone,service_title,details,stage,booking_ref,reference,agreed_quotation_id,created_at").order("created_at", { ascending: false }).limit(1000);
  const list = bookings ?? [];
  const ids = list.map((b) => b.id as string);
  if (!ids.length) return { rows: [], phones: new Map() };
  const [{ data: quotes }, { data: pays }] = await Promise.all([
    supabase.from("quotations").select("id,booking_id,price_cents,discount_cents,currency,start_date,completion_date,status,version").in("booking_id", ids).eq("status", "accepted"),
    supabase.from("booking_payments").select("booking_id,amount_cents,status").in("booking_id", ids).eq("status", "recorded"),
  ]);
  const quoteBy = new Map<string, NonNullable<typeof quotes>[number]>();
  for (const q of quotes ?? []) { const cur = quoteBy.get(q.booking_id); if (!cur || q.version > cur.version) quoteBy.set(q.booking_id, q); }
  const paid = new Map<string, number>();
  for (const p of pays ?? []) paid.set(p.booking_id, (paid.get(p.booking_id) ?? 0) + Number(p.amount_cents));
  const phones = new Map<string, string>();
  const rows = list.map((b) => {
    const q = quoteBy.get(b.id);
    if (b.phone && !phones.has(String(b.email).toLowerCase())) phones.set(String(b.email).toLowerCase(), b.phone);
    return {
      id: b.id, title: projectTitle(b as never), service: b.service_title, client: b.name, email: String(b.email).toLowerCase(), stage: (b.stage ?? "new_enquiry") as Stage,
      bookingRef: b.booking_ref, enquiryRef: b.reference, currency: q?.currency ?? null,
      agreedCents: q ? Math.max(0, Number(q.price_cents) - Number(q.discount_cents)) : 0, paidCents: paid.get(b.id) ?? 0,
      startDate: q?.start_date ?? null, completionDate: q?.completion_date ?? null, createdAt: b.created_at,
    } satisfies ProjectRow;
  });
  return { rows, phones };
}

/** Totals kept per currency, so naira and dollars are never added together. */
export function totalsByCurrency(rows: ProjectRow[], pick: (r: ProjectRow) => number): string {
  const m = new Map<string, number>();
  for (const r of rows) if (r.currency) m.set(r.currency, (m.get(r.currency) ?? 0) + pick(r));
  const parts = [...m.entries()].filter(([, v]) => v > 0).map(([c, v]) => formatMoney(v, c));
  return parts.length ? parts.join(" + ") : "None";
}
export { STAGE_LABEL };
