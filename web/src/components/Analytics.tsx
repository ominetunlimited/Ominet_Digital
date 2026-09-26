"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track-client";

/** Mounted once in the root layout — fires a page_view on first load and on
 *  every client-side route change (App Router doesn't reload on navigation,
 *  so this can't be a server-side "log every request" approach). */
export default function Analytics() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_view");
  }, [pathname]);

  return null;
}
