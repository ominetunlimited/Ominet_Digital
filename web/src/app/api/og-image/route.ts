import { NextResponse, type NextRequest } from "next/server";
import { loadImage, createCanvas } from "@napi-rs/canvas";
import { SUPABASE_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const MAX_WIDTH = 1200;
const FETCH_BYTES_LIMIT = 15 * 1024 * 1024; // an admin upload cap, not a crafted-response cap

/**
 * WhatsApp, Facebook etc. fetch og:image directly and are strict about size
 * — a raw admin upload (a full-resolution book cover can be several MB)
 * routinely times out or gets silently dropped there, which is why a share
 * can show no thumbnail at all even though the page has a perfectly good
 * cover. This re-encodes any source image down to a small, share-safe JPEG
 * on the fly. Deliberately not Next's own /_next/image optimizer: its
 * built-in resizer times out on a large enough source on this project's
 * infrastructure, which is exactly the case this route exists to handle.
 *
 * `url` is restricted to this project's own Supabase Storage — every cover/
 * featured image already lives there — so this can't be turned into an
 * open fetch proxy for arbitrary URLs (SSRF).
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("url") ?? "";
  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return new NextResponse("Bad request.", { status: 400 });
  }
  const allowedHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null;
  if (parsed.protocol !== "https:" || !allowedHost || parsed.hostname !== allowedHost) {
    return new NextResponse("That image source isn't allowed.", { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    const res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(25000) });
    if (!res.ok || !res.body) return new NextResponse("Couldn't fetch that image.", { status: 502 });
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > FETCH_BYTES_LIMIT) return new NextResponse("Image too large.", { status: 413 });
    bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > FETCH_BYTES_LIMIT) return new NextResponse("Image too large.", { status: 413 });
  } catch {
    return new NextResponse("Couldn't fetch that image.", { status: 502 });
  }

  try {
    const img = await loadImage(bytes);
    const scale = Math.min(1, MAX_WIDTH / img.width);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    // White backing so a transparent source doesn't turn black once re-encoded as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const jpeg = canvas.toBuffer("image/jpeg", 72);
    // Buffer's ArrayBufferLike type (it may be backed by a SharedArrayBuffer)
    // is stricter than BlobPart wants, though a real Buffer always works here.
    return new NextResponse(new Blob([jpeg as unknown as BlobPart]), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse("Couldn't process that image.", { status: 500 });
  }
}
