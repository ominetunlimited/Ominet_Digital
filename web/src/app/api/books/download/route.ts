import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonKey } from "@/lib/anon-key";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REF_RE = /^omd_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FORMATS = new Set(["pdf", "epub", "mobi", "docx"]);

const LINK_SECONDS = 60;
const PER_READER_PER_HOUR = 20;
const FREE_SITEWIDE_PER_HOUR = 500;

function deny(status: number, message: string) {
  return new NextResponse(message, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

/**
 * The ONLY way a book file leaves storage. It checks the reader is allowed,
 * then answers with a redirect to a signed link that dies after a minute.
 * Free books need no payment; paid books need either an entitlement (signed-in
 * account, or the buyer's own browser) or the reference of a Paystack order
 * that the server has verified as paid.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const bookId = p.get("book") ?? "";
  const format = p.get("format") ?? "";
  const ref = p.get("ref") ?? "";
  if (!UUID_RE.test(bookId) || !FORMATS.has(format) || (ref && !REF_RE.test(ref))) return deny(400, "Bad request.");

  const admin = createAdminClient();
  if (!admin) return deny(503, "Downloads aren't available right now.");

  const { data: book } = await admin.from("books").select("id,slug,status,sales_mode").eq("id", bookId).maybeSingle();
  if (!book || book.status !== "published" || (book.sales_mode !== "free_download" && book.sales_mode !== "direct_sale")) {
    return deny(404, "Not found.");
  }
  const { data: file } = await admin.from("book_files").select("id,storage_path").eq("book_id", book.id).eq("format", format).maybeSingle();
  if (!file) return deny(404, "Not found.");

  const guestKey = await getOrCreateAnonKey();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let kind: "free" | "paid" = "free";
  let orderId: string | null = null;

  if (book.sales_mode === "direct_sale") {
    kind = "paid";
    let allowed = false;

    const authClient = await createClient();
    const {
      data: { user },
    } = authClient ? await authClient.auth.getUser() : { data: { user: null } };
    if (user) {
      const { data } = await admin.from("entitlements").select("order_id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
      if (data) {
        allowed = true;
        orderId = data.order_id ?? null;
      }
    }
    if (!allowed) {
      const { data } = await admin.from("entitlements").select("order_id").eq("guest_key", guestKey).eq("book_id", book.id).maybeSingle();
      if (data) {
        allowed = true;
        orderId = data.order_id ?? null;
      }
    }
    // A saved receipt link: the unguessable Paystack reference of a paid order
    // for this book works from any device.
    if (!allowed && ref) {
      const { data } = await admin.from("orders").select("id").eq("provider_reference", ref).eq("book_id", book.id).eq("status", "paid").maybeSingle();
      if (data) {
        allowed = true;
        orderId = data.id;
      }
    }
    if (!allowed) return deny(403, "Buy this book to download it.");
  } else {
    const { count: site } = await admin.from("book_downloads").select("id", { count: "exact", head: true }).eq("kind", "free").gte("created_at", hourAgo);
    if ((site ?? 0) >= FREE_SITEWIDE_PER_HOUR) return deny(429, "Downloads are busy right now. Please try again shortly.");
  }

  const { count: mine } = await admin.from("book_downloads").select("id", { count: "exact", head: true }).eq("guest_key", guestKey).gte("created_at", hourAgo);
  if ((mine ?? 0) >= PER_READER_PER_HOUR) return deny(429, "You've downloaded a lot in the last hour. Please try again later.");

  const { data: signed, error } = await admin.storage.from("book-files").createSignedUrl(file.storage_path, LINK_SECONDS, { download: `${book.slug}.${format}` });
  if (error || !signed) return deny(500, "Couldn't prepare the download. Please try again.");

  await admin.from("book_downloads").insert({ book_id: book.id, file_id: file.id, kind, order_id: orderId, guest_key: guestKey });
  await admin.from("analytics_events").insert({
    event_type: "download",
    path: `/books/${book.slug}`,
    metadata: { book_id: book.id, format, kind },
  });

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
