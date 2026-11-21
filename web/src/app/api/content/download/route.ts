import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REF_RE = /^omd_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const LINK_SECONDS = 60;
const PER_READER_PER_HOUR = 20;

function deny(status: number, message: string) {
  return new NextResponse(message, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

/**
 * The ONLY way an article's attached document leaves storage. Free articles
 * need no payment; paid articles need either an entitlement (signed-in
 * account, or the buyer's own browser) or the reference of a verified paid
 * order — the same rules already used for paid-article reading access and
 * for book downloads.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const contentId = p.get("content") ?? "";
  const ref = p.get("ref") ?? "";
  if (!UUID_RE.test(contentId) || (ref && !REF_RE.test(ref))) return deny(400, "Bad request.");

  const admin = createAdminClient();
  if (!admin) return deny(503, "Downloads aren't available right now.");

  const { data: article } = await admin
    .from("content")
    .select("id,slug,status,access,attachment_storage_path,attachment_original_name,attachment_format")
    .eq("id", contentId)
    .maybeSingle();
  if (!article || article.status !== "published" || !article.attachment_storage_path) return deny(404, "Not found.");

  const guestKey = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  if (article.access !== "free") {
    let allowed = false;
    const authClient = await createClient();
    const {
      data: { user },
    } = authClient ? await authClient.auth.getUser() : { data: { user: null } };
    if (user) {
      const { data } = await admin.from("entitlements").select("id").eq("user_id", user.id).eq("content_id", article.id).maybeSingle();
      allowed = Boolean(data);
    }
    if (!allowed) {
      const { data } = await admin.from("entitlements").select("id").eq("guest_key", guestKey).eq("content_id", article.id).maybeSingle();
      allowed = Boolean(data);
    }
    if (!allowed && ref) {
      const { data } = await admin.from("orders").select("id").eq("provider_reference", ref).eq("content_id", article.id).eq("status", "paid").maybeSingle();
      allowed = Boolean(data);
    }
    if (!allowed) return deny(403, "This article is paid — unlock it to download the file.");
  }

  const { count: mine } = await admin.from("content_downloads").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo);
  if ((mine ?? 0) >= PER_READER_PER_HOUR) return deny(429, "You've downloaded a lot in the last hour. Please try again later.");

  const { data: signed, error } = await admin.storage
    .from("content-files")
    .createSignedUrl(article.attachment_storage_path, LINK_SECONDS, { download: article.attachment_original_name ?? `${article.slug}.${article.attachment_format}` });
  if (error || !signed) return deny(500, "Couldn't prepare the download. Please try again.");

  await admin.from("content_downloads").insert({ content_id: article.id, guest_key: guestKey });
  await admin.from("analytics_events").insert({
    event_type: "download",
    path: `/articles/${article.slug}`,
    content_id: article.id,
    metadata: { format: article.attachment_format },
  });

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
