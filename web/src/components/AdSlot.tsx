import { getAdPlacement } from "@/lib/data";
import { css } from "@/lib/css";

/**
 * Renders nothing unless an admin has activated this slot (see
 * /admin/advertising) — ads only appear where explicitly enabled, per
 * project/README.md section 26. Sponsored/direct placements are always
 * labelled "Sponsored" so they're never mistaken for editorial content.
 */
export default async function AdSlot({ slotKey }: { slotKey: string }) {
  const placement = await getAdPlacement(slotKey);
  if (!placement) return null;

  if (placement.provider === "adsense") {
    if (!placement.adClient || !placement.adSlot) return null;
    return (
      <div style={css("padding:var(--space-4) var(--space-6);")}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={placement.adClient}
          data-ad-slot={placement.adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (!placement.htmlSnippet) return null;
  return (
    <div style={css("padding:var(--space-4) var(--space-6);")}>
      <div style={css("font-size:10px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-2);")}>SPONSORED</div>
      <div dangerouslySetInnerHTML={{ __html: placement.htmlSnippet }} />
    </div>
  );
}
