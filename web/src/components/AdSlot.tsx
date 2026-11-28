import { getSlot, pickAd } from "@/lib/ads";
import { css } from "@/lib/css";
import TrackedAd from "@/components/TrackedAd";
import AdSenseUnit from "@/components/AdSenseUnit";

/**
 * Renders nothing unless an admin has activated this slot (Admin → Advertising).
 * A slot is either AdSense or "direct": structured ads (image, headline, link)
 * that the site itself renders and labels. Raw HTML is never injected.
 */
export default async function AdSlot({ slotKey }: { slotKey: string }) {
  const slot = await getSlot(slotKey);
  if (!slot) return null;

  if (slot.provider === "adsense") {
    if (!slot.adClient || !slot.adSlot) return null;
    return (
      <div style={css("padding:var(--space-4) var(--space-6);")}>
        <AdSenseUnit adClient={slot.adClient} adSlot={slot.adSlot} />
      </div>
    );
  }

  const ad = await pickAd(slotKey);
  if (!ad) return null;
  return (
    <div style={css("padding:var(--space-4) var(--space-6);")}>
      <TrackedAd adId={ad.id} ad={ad} />
    </div>
  );
}
