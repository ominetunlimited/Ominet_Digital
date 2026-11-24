import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// Counts one read for a published blog post, article or book. Same-origin only,
// rate limited, and only for items that exist and are public. Always 200.
const KINDS = new Set(["blog", "articles", "books"]);
const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let same = false;
    try { same = new URL(origin).host === request.headers.get("host"); } catch {}
    if (!same) return NextResponse.json({ ok: false });
  }
  if (!rateLimit(clientKey(request, "read"), 60, 60_000).ok) return NextResponse.json({ ok: false });

  let body: { kind?: string; slug?: string } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }); }
  const { kind, slug } = body;
  if (!kind || !KINDS.has(kind) || !slug || !SLUG.test(slug)) return NextResponse.json({ ok: false });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });

  try {
    let exists = false;
    if (kind === "books") {
      const { data } = await admin.from("books").select("id").eq("slug", slug).maybeSingle();
      exists = Boolean(data);
    } else {
      const { data } = await admin.from("content").select("id").eq("slug", slug).eq("status", "published").maybeSingle();
      exists = Boolean(data);
    }
    if (!exists) return NextResponse.json({ ok: false });
    const { data: reads } = await admin.rpc("increment_read", { p_kind: kind, p_slug: slug });
    return NextResponse.json({ ok: true, reads });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
