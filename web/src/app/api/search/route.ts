import { NextResponse } from "next/server";
import { searchContent } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
