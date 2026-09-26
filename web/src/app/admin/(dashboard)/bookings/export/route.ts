import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COLUMNS = [
  "created_at", "status", "service_title", "name", "email", "phone",
  "preferred_date", "preferred_time", "confirmed_date", "confirmed_time", "message", "internal_notes",
] as const;

// A cell starting with = + - @ is executed as a formula when the CSV is
// opened in Excel/Sheets — and these cells are text strangers typed in.
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// /admin/* is already behind the session + staff-role proxy, and RLS
// (bookings_staff_all) returns no rows to anyone who isn't staff.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").replace(/[,()%*\\]/g, " ").trim();

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  let query = supabase.from("bookings").select(COLUMNS.join(",")).order("created_at", { ascending: false }).limit(5000);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,service_title.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${status}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
