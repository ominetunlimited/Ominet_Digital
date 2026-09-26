import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateAnonKey } from "@/lib/anon-key";

// Public write endpoint for first-party analytics — no account, no auth.
// RLS (`analytics_public_insert`) already restricts this to insert-only;
// reads require staff. Always returns 200 so a failed beacon never shows
// up as a broken request to the page that fired it.
const KNOWN_EVENTS = new Set([
  "page_view",
  "outbound_click",
  "share",
  "search",
  "signup",
  "purchase",
  "payment_failed",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 200 });

  let body: {
    eventType?: string;
    path?: string;
    referrer?: string | null;
    contentId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (!body.eventType || !KNOWN_EVENTS.has(body.eventType)) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const visitorKey = await getOrCreateAnonKey();

  await supabase.from("analytics_events").insert({
    event_type: body.eventType,
    path: typeof body.path === "string" ? body.path.slice(0, 500) : null,
    content_id: typeof body.contentId === "string" ? body.contentId : null,
    product_id: typeof body.productId === "string" ? body.productId : null,
    metadata: { ...(body.metadata ?? {}), visitor_key: visitorKey, referrer: body.referrer ?? null },
  });

  return NextResponse.json({ ok: true });
}
