"use client";

import { useEffect } from "react";

interface AdSenseAdProps {
  /** Ad slot ID from your Google AdSense account */
  adSlot: string;
  /** Ad format: responsive, in-article, in-feed, etc. */
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  /** Additional CSS class for styling */
  className?: string;
}

/**
 * Google AdSense Ad Component
 * 
 * Usage:
 * ```tsx
 * import AdSenseAd from "@/components/AdSenseAd";
 * 
 * <AdSenseAd adSlot="1234567890" format="auto" />
 * ```
 * 
 * Make sure to:
 * 1. Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env.local
 * 2. Create ad units in your Google AdSense account
 * 3. Use the slot IDs from AdSense dashboard
 */
export default function AdSenseAd({ adSlot, format = "auto", className = "" }: AdSenseAdProps) {
  useEffect(() => {
    try {
      // Push the ad configuration to Google AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
        adsbygoogle: true,
      });
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Extend window type to include adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: any;
  }
}
