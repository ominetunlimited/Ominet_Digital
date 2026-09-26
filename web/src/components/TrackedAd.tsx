"use client";

import { useEffect, useRef } from "react";
import AdCard, { type AdCardData } from "@/components/AdCard";

function send(adId: string, type: "impression" | "click") {
  try {
    fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, type }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // a failed beacon must never affect the page
  }
}

/**
 * An impression counts only when at least half the ad has been on screen for a
 * full second — not merely because the page loaded with it far below the fold.
 */
export default function TrackedAd({ adId, ad }: { adId: string; ad: AdCardData }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5);
        if (visible && !timer) {
          timer = setTimeout(() => {
            send(adId, "impression");
            observer.disconnect();
          }, 1000);
        } else if (!visible && timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [adId]);

  return (
    <div ref={ref}>
      <AdCard ad={ad} onClick={() => send(adId, "click")} />
    </div>
  );
}
