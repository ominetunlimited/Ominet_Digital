import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { css } from "@/lib/css";
import { fulfillPaystackReference } from "@/lib/payments/fulfill";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBookDelivery, type BookDelivery } from "@/lib/books/delivery";
import BookAccess from "@/components/BookAccess";

const ATTACHMENT_LABEL: Record<string, string> = { pdf: "PDF", docx: "Word (DOCX)" };

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
  let article: { id: string; slug: string; title: string; attachmentFormat?: string | null } | undefined;
  let book: { id: string; slug: string; title: string } | undefined;
  let delivery: BookDelivery | null = null;

  if (reference) {
    try {
      const result = await fulfillPaystackReference(reference);
      success = result.status === "paid" || result.alreadyFulfilled === true;
      // A paid order for a book: show its downloads right here. The reference
      // in the URL is the buyer's receipt — verified as paid above, and
      // unguessable — so this page also works from another device.
      const bookId = (result.order as { book_id?: string | null }).book_id;
      const contentId = (result.order as { content_id?: string | null }).content_id;
      if (success && bookId) {
        const admin = createAdminClient();
        const { data } = admin ? await admin.from("books").select("id,slug,title").eq("id", bookId).maybeSingle() : { data: null };
        if (data) {
          book = data;
          delivery = await getBookDelivery(data.id);
        }
      } else if (success && contentId) {
        const admin = createAdminClient();
        const { data } = admin
          ? await admin.from("content").select("id,slug,title,attachment_format").eq("id", contentId).maybeSingle()
          : { data: null };
        if (data) {
          article = data;
          contentSlug = data.slug;
        }
      }
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
        {book && delivery && (
          <div style={css("max-width:520px;margin:0 auto var(--space-6);text-align:left;")}>
            <BookAccess bookId={book.id} delivery={{ ...delivery, salesMode: "direct_sale" }} owned signedIn={false} receiptRef={reference} />
            <p style={css("font-size:12px;opacity:0.6;")}>
              Bookmark this page — it is your receipt, and you can come back to it to download &ldquo;{book.title}&rdquo; again.
            </p>
          </div>
        )}
        {article && article.attachmentFormat && (
          <div style={css("max-width:520px;margin:0 auto var(--space-6);text-align:left;")}>
            <a
              href={`/api/content/download?content=${article.id}${reference ? `&ref=${encodeURIComponent(reference)}` : ""}`}
              rel="nofollow"
              className="btn btn-primary"
            >
              Download {ATTACHMENT_LABEL[article.attachmentFormat] ?? article.attachmentFormat.toUpperCase()}
            </a>
            <p style={css("font-size:12px;opacity:0.6;margin-top:var(--space-2);")}>
              Bookmark this page — it is your receipt, and you can come back to it to download &ldquo;{article.title}&rdquo; again.
            </p>
          </div>
        )}
        {book ? (
          <Link href={`/books/${book.slug}`}>
            <button type="button" className="btn btn-secondary">Back to the book</button>
          </Link>
        ) : (
          <Link href={contentSlug ? `/writing/${contentSlug}` : "/writing"}>
            <button type="button" className="btn btn-primary">Back to Writing</button>
          </Link>
        )}
      </section>
      <div className="hr" />
      <Footer />
    </div>
  );
}
