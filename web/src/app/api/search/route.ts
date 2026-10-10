import { NextResponse } from "next/server";
import { searchContent } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// Search runs a database query per call, so bound it per IP to keep a script
// from hammering it into a slow/expensive endpoint.
const RATE_LIMIT = 60; // requests…
const RATE_WINDOW_MS = 60 * 1000; // …per minute, per IP.

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "search"), RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const results = await searchContent(q);

  if (q.trim()) {
    const resultCount = results.articles.length + results.books.length;
    const supabase = await createClient();
    // Fire-and-forget: a logging failure must never affect search results.
    supabase
      ?.from("analytics_events")
      .insert({ event_type: "search", path: "/search", metadata: { term: q.trim().slice(0, 200), result_count: resultCount } })
      .then(
        () => {},
        () => {}
      );
  }

  return NextResponse.json(results);
}
