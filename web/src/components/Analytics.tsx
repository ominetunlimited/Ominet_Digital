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

  useEffect(() => {
    const onLinkClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link) return;

      const href = (link.getAttribute("href") || "").trim();
      if (!href) return;

      // Contact actions: record the kind of link only, never the address or number.
      const lower = href.toLowerCase();
      const contactKind = lower.startsWith("mailto:") ? "email" : lower.startsWith("tel:") ? "phone" : /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(lower) ? "whatsapp" : null;
      if (contactKind) {
        track("contact_click", { kind: contactKind });
        return;
      }

      const isDownloadLink =
        link.hasAttribute("download") ||
        href.includes("/download") ||
        href.includes("/files/") ||
        href.includes("/uploads/") ||
        /\.(pdf|zip|rar|csv|xls|xlsx|doc|docx|ppt|pptx|txt|json|xml|mp3|mp4|mov|avi|jpg|jpeg|png|webp|gif|svg|eps)(?:[?#].*)?$/i.test(href);

      if (!isDownloadLink) return;

      const fileName =
        link.getAttribute("download") ||
        decodeURIComponent(href.split("/").pop()?.split("?")[0] || "download");

      track("download", {
        fileName,
        href,
        kind: link.getAttribute("data-download-kind") || "file",
      });
    };

    document.addEventListener("click", onLinkClick, true);
    return () => document.removeEventListener("click", onLinkClick, true);
  }, []);

  return null;
}
