import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PlaceholderImage from "@/components/PlaceholderImage";
import ProductBuyButton from "@/components/ProductBuyButton";
import EmptyState from "@/components/EmptyState";
import { css } from "@/lib/css";
import { pageMetadata } from "@/lib/seo";
import { getProducts } from "@/lib/data";
import { getCurrentUser } from "@/lib/entitlements";
import { formatMoney } from "@/lib/money";

export const revalidate = 60;

export const generateMetadata = () => pageMetadata(
  "Store",
  "Ebooks, digital publications and resources from Ominet Digital.",
  "/store"
);

const BUY_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

function formatPrice(cents: number | null, currency: string): string {
  return cents == null ? "Free" : formatMoney(cents, currency);
}

export default async function StorePage() {
  const [products, user] = await Promise.all([getProducts(), getCurrentUser()]);

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <svg width="150" height="150" viewBox="0 0 150 150" style={css("position:absolute;right:32px;top:24px;pointer-events:none;")} aria-hidden="true">
        <g fill="var(--om-coral)" opacity="0.2">
          <circle cx="10" cy="10" r="2" /><circle cx="40" cy="10" r="2" /><circle cx="70" cy="10" r="2" /><circle cx="100" cy="10" r="2" /><circle cx="130" cy="10" r="2" />
          <circle cx="10" cy="40" r="2" /><circle cx="40" cy="40" r="2" /><circle cx="70" cy="40" r="2" /><circle cx="100" cy="40" r="2" /><circle cx="130" cy="40" r="2" />
          <circle cx="10" cy="70" r="2" /><circle cx="40" cy="70" r="2" /><circle cx="70" cy="70" r="2" /><circle cx="100" cy="70" r="2" /><circle cx="130" cy="70" r="2" />
        </g>
      </svg>

      <section style={css("padding:var(--space-8) var(--space-6) var(--space-6);")}>
        <div style={css("font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>STORE</div>
        <h1 style={css("font-family:var(--font-heading);font-size:56px;margin:0;")}>Store</h1>
        <p style={css("font-size:16px;opacity:0.7;max-width:56ch;margin:var(--space-3) 0 0;")}>Ebooks, digital publications and resources. Some items check out here; others link to an external platform.</p>
      </section>

      <div className="hr" />

      <section style={css("padding:var(--space-8) var(--space-6);")}>
        {products.length === 0 ? (
          <EmptyState title="No products yet." body="Nothing here yet. Please check back soon." />
        ) : (
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-6);")}>
          {products.map((p) => {
                const isExternal = p.access === "external" || p.access === "affiliate";
                const cta = p.externalLabel || (p.access === "affiliate" ? "Get it" : p.access === "external" ? "Buy now" : p.priceCents == null ? "Download" : "Buy now");
                const variant = isExternal ? "secondary" : "primary";
                const body = (
                  <>
                    <div style={css("aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);")}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" style={css("width:100%;height:100%;object-fit:cover;")} />
                      ) : (
                        <PlaceholderImage label="Product" />
                      )}
                    </div>
                    <div style={css("font-family:var(--font-heading);font-size:17px;margin-bottom:var(--space-1);")}>{p.title}</div>
                    <div style={css("font-size:13px;opacity:0.55;margin-bottom:var(--space-2);")}>{formatPrice(p.priceCents, p.currency)}</div>
                    {p.access === "affiliate" && p.affiliateDisclosure && (
                      <div style={css("font-size:11px;opacity:0.5;margin-bottom:var(--space-2);")}>{p.affiliateDisclosure}</div>
                    )}
                    {isExternal && p.externalUrl ? (
                      <a href={p.externalUrl} target="_blank" rel="noopener noreferrer sponsored" className={`btn btn-${variant} btn-block`}>{cta}{BUY_ICON}</a>
                    ) : p.priceCents != null ? (
                      <ProductBuyButton productId={p.id} label={cta} variant={variant} signedIn={Boolean(user)} />
                    ) : (
                      <button type="button" className={`btn btn-${variant} btn-block`} disabled title="Free downloads aren't wired up yet">
                        {cta} (coming soon)
                      </button>
                    )}
                  </>
                );
                return <div key={p.id}>{body}</div>;
          })}
        </div>
        )}
      </section>

      <div className="hr" />
      <Footer />
    </div>
  );
}
