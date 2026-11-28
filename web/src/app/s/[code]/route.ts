import { NextResponse } from "next/server";
import { resolveShortCode } from "@/lib/short-links";
import { SITE_URL } from "@/lib/seo";

// ominetdigital.com.ng/s/<code> sends people (and link-preview bots) to the full page.
// A temporary redirect, so the destination can change later. Never indexed itself.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const path = await resolveShortCode(code.toLowerCase());
  if (!path) return NextResponse.redirect(SITE_URL, 302); // an unknown or mistyped code lands on the homepage
  const res = NextResponse.redirect(`${SITE_URL}${path}`, 302);
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
