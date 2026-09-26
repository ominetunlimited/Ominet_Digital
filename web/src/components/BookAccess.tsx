import { css } from "@/lib/css";
import { formatMoney } from "@/lib/money";
import type { BookDelivery } from "@/lib/books/delivery";
import ProductBuyButton from "@/components/ProductBuyButton";

const FORMAT_LABEL: Record<string, string> = { pdf: "PDF", epub: "EPUB", mobi: "MOBI", docx: "Word (DOCX)" };

function fmtSize(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

/**
 * Free download, paid purchase, or the owner's download buttons. Downloads are
 * plain links (not next/link, so nothing is fetched until someone clicks) to
 * the gated endpoint, which issues a short-lived signed link after checking
 * access — the file's real location is never in the page.
 */
export default function BookAccess({
  bookId,
  delivery,
  owned,
  signedIn,
  receiptRef,
}: {
  bookId: string;
  delivery: BookDelivery;
  owned: boolean;
  signedIn: boolean;
  receiptRef?: string;
}) {
  const free = delivery.salesMode === "free_download";
  const canDownload = free || owned;

  const label = free ? "FREE DOWNLOAD" : owned ? "YOU OWN THIS BOOK" : "BUY DIRECT";

  return (
    <div style={css("margin-bottom:var(--space-6);")}>
      <div style={css("font-size:12px;letter-spacing:0.08em;opacity:0.55;margin-bottom:var(--space-2);")}>{label}</div>

      {canDownload ? (
        <>
          <div style={css("display:flex;gap:var(--space-3);flex-wrap:wrap;")}>
            {delivery.files.map((f, i) => (
              <a
                key={f.format}
                href={`/api/books/download?book=${bookId}&format=${f.format}${receiptRef ? `&ref=${encodeURIComponent(receiptRef)}` : ""}`}
                rel="nofollow"
                className={i === 0 ? "btn btn-primary" : "btn btn-secondary"}
              >
                Download {FORMAT_LABEL[f.format] ?? f.format.toUpperCase()} · {fmtSize(f.sizeBytes)}
              </a>
            ))}
          </div>
          {!free && (
            <div style={css("font-size:12px;opacity:0.55;margin-top:var(--space-2);")}>
              Downloads work in this browser{signedIn ? " and on your account" : ""}. Keep your receipt page bookmarked to download again from another device.
            </div>
          )}
        </>
      ) : (
        <div style={css("max-width:320px;")}>
          <div style={css("font-family:var(--font-heading);font-size:24px;margin-bottom:var(--space-2);")}>{formatMoney(delivery.priceCents, delivery.currency)}</div>
          <ProductBuyButton bookId={bookId} label={`Buy · ${formatMoney(delivery.priceCents, delivery.currency)}`} variant="primary" signedIn={signedIn} />
          <div style={css("font-size:12px;opacity:0.55;margin-top:var(--space-2);")}>
            {delivery.files.map((f) => FORMAT_LABEL[f.format] ?? f.format).join(" · ")} — no account needed. Paid securely through Paystack.
          </div>
        </div>
      )}
    </div>
  );
}
