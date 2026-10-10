"use client";

import { useEffect } from "react";

interface AdSenseResponsiveProps {
  /** Ad slot ID from your Google AdSense account */
  adSlot: string;
  /** Additional CSS class for styling */
  className?: string;
}

/**
 * Responsive AdSense Ad Component
 * Best for: Main content area, flexible layouts
 * 
 * Usage:
 * ```tsx
 * import AdSenseResponsive from "@/components/AdSenseResponsive";
 * 
 * <AdSenseResponsive adSlot="1234567890" className="my-4" />
 * ```
 */
export default function AdSenseResponsive({ adSlot, className = "" }: AdSenseResponsiveProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
        adsbygoogle: true,
      });
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

declare global {
  interface Window {
    adsbygoogle?: any;
  }
}
