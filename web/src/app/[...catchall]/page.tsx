import { notFound, permanentRedirect, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Never statically cached: a disabled/edited/deleted redirect must take
// effect on the very next request, not the next rebuild.
export const dynamic = "force-dynamic";

/**
 * The site's last resort: Next only reaches this catch-all when no real page,
 * static file or API route matched the URL, so a redirect entry can never
 * hijack a working route. If the address isn't in the redirects table either,
 * this hands off to the real not-found page (src/app/not-found.tsx) — the
 * same honest 404 every other missing page gets.
 *
 * 301 is served as an HTTP 308 (permanent) and 302 as a 307 (temporary):
 * Next's App Router only exposes those two codes from a page, and search
 * engines treat 308/301 and 307/302 as equivalent.
 */
export default async function CatchAllRedirectPage({ params }: { params: Promise<{ catchall: string[] }> }) {
  const { catchall } = await params;
  const path = `/${catchall.join("/")}`;

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("redirects")
      .select("to_path,status_code")
      .eq("from_path", path)
      .eq("active", true)
      .eq("archived", false)
      .maybeSingle();

    if (data) {
      // Best-effort: a failure to log the hit must never block the redirect itself.
      admin.rpc("record_redirect_hit", { target_path: path }).then(
        () => {},
        () => {}
      );
      if (data.status_code === 301) permanentRedirect(data.to_path);
      redirect(data.to_path);
    }
  }

  notFound();
}
