"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@/lib/analytics/track-client";

/** A plain external <a>, except the click also fires an outbound_click
 *  analytics event first — used for purchase links (Selar/Amazon/Google
 *  Books/affiliate), research profile links, etc. Never blocks or delays
 *  the navigation itself. */
export default function TrackedLink({
  eventMetadata,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & { eventMetadata: Record<string, unknown> }) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        track("outbound_click", eventMetadata);
        anchorProps.onClick?.(e);
      }}
    />
  );
}
