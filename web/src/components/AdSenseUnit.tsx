"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One AdSense unit, set up to be quiet and fast:
 * - the ad is requested only when it is about to scroll into view (nothing above the fold is slowed down);
 * - it is always labelled "Advertisement" so it can't pass for editorial content;
 * - it reserves a modest height so the page doesn't jump when the ad arrives;
 * - if Google has no ad to show (unfilled), the whole block disappears instead of leaving a gap.
 * The request is made once per unit. Nothing here encourages or pressures clicks.
 */
export default function AdSenseUnit({ adClient, adSlot }: { adClient: string; adSlot: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ins = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const box = wrap.current;
    const unit = ins.current;
    if (!box || !unit) return;

    const request = () => {
      if (requested.current) return;
      requested.current = true;
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch {
        // AdSense blocked or not loaded: leave the block empty rather than break the page
        setUnfilled(true);
      }
    };

    // Google marks the element when it has nothing to show.
    const status = new MutationObserver(() => {
      if (unit.getAttribute("data-ad-status") === "unfilled") setUnfilled(true);
    });
    status.observe(unit, { attributes: true, attributeFilter: ["data-ad-status"] });

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined") request();
    else {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { request(); io?.disconnect(); } }, { rootMargin: "300px 0px" });
      io.observe(box);
    }
    return () => { io?.disconnect(); status.disconnect(); };
  }, []);

  if (unfilled) return null;
  return (
    <div ref={wrap} style={{ maxWidth: 728, margin: "0 auto", minHeight: 120, contain: "layout" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", opacity: 0.55, marginBottom: 6, textTransform: "uppercase" }}>Advertisement</div>
      <ins ref={ins} className="adsbygoogle" style={{ display: "block" }} data-ad-client={adClient} data-ad-slot={adSlot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
