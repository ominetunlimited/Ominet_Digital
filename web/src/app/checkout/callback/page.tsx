import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { fulfillPaystackReference } from "@/lib/payments/fulfill";

export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  let success = false;
  let message = "We couldn't find that transaction.";
  let contentSlug: string | undefined;

  if (reference) {
    try {
      const result = await fulfillPaystackReference(reference);
      success = result.status === "paid" || result.alreadyFulfilled === true;
      contentSlug = undefined;
      message = success
        ? "Payment confirmed — you now have full access."
        : "The payment could not be completed. No charge was made.";
    } catch (e) {
      message = e instanceof Error ? e.message : "Something went wrong verifying the payment.";
    }
  }

  return (
    <div style={css("max-width:1440px;margin:0 auto;background:var(--color-bg);position:relative;overflow:hidden;")}>
      <Nav />
      <section style={css("padding:var(--space-8) var(--space-6);text-align:center;")}>
        <div style={css("font-family:var(--font-heading);font-size:11px;letter-spacing:0.1em;opacity:0.5;margin-bottom:var(--space-3);")}>
          {success ? "PAYMENT CONFIRMED" : "ERROR"}
        </div>
        <h1 style={css("font-family:var(--font-heading);font-size:32px;margin:0 0 var(--space-3);")}>
          {success ? "You're all set." : "Something went wrong."}
        </h1>
        <p style={css("font-size:15px;opacity:0.65;margin:0 0 var(--space-4);")}>{message}</p>
        <Link href={contentSlug ? `/writing/${contentSlug}` : "/writing"}>
          <button type="button" className="btn btn-primary">Back to Writing</button>
        </Link>
      </section>
      <div className="hr" />
      <Footer />
    </div>
  );
}
