import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BOT_RE = /bot|crawl|spider|slurp|preview|monitor/i;

// The same reader seeing one ad again within this window is one impression.
const IMPRESSION_WINDOW_MS = 30 * 60 * 1000;
const CLICK_WINDOW_MS = 5 * 60 * 1000;
const MAX_EVENTS_PER_READER_PER_HOUR = 300;

const done = () => new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/**
 * Records an ad impression or click. Always answers 204 so a beacon never
 * shows up as an error on the page. Only counts real, distinct views of ads
 * that are genuinely live; nothing here is ever turned into revenue figures.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    let sameSite = false;
    try {
      sameSite = new URL(origin).host === request.headers.get("host");
    } catch {}
    if (!sameSite) return done();
  }
  if (BOT_RE.test(request.headers.get("user-agent") ?? "")) return done();

  let body: { adId?: unknown; type?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return done();
  }
  const adId = typeof body.adId === "string" ? body.adId : "";
  const type = body.type === "impression" || body.type === "click" ? body.type : null;
  if (!UUID_RE.test(adId) || !type) return done();

  const admin = createAdminClient();
  if (!admin) return done();

  const { data: ad } = await admin.from("ads").select("id,campaign_id,status").eq("id", adId).maybeSingle();
  if (!ad || ad.status !== "published") return done();
  const { data: live } = await admin.rpc("ad_campaign_is_live", { cid: ad.campaign_id });
  if (!live) return done();

  const guestKey = await getOrCreateAnonKey();
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const windowStart = new Date(now - (type === "impression" ? IMPRESSION_WINDOW_MS : CLICK_WINDOW_MS)).toISOString();

  const [recent, total] = await Promise.all([
    admin.from("ad_events").select("id", { count: "exact", head: true }).eq("ad_id", adId).eq("event_type", type).eq("guest_key", guestKey).gte("created_at", windowStart),
    admin.from("ad_events").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo),
  ]);
  if ((recent.count ?? 0) > 0 || (total.count ?? 0) >= MAX_EVENTS_PER_READER_PER_HOUR) return done();

  await admin.from("ad_events").insert({ ad_id: adId, event_type: type, guest_key: guestKey });
  return done();
}
