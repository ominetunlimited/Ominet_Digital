import Link from "next/link";
import LegalShell from "@/components/LegalShell";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata(
  "Terms and Conditions",
  "The terms on which Ominet Digital provides its website, content, products and professional services.",
  "/terms"
);

export default function TermsPage() {
  return (
    <LegalShell eyebrow="LEGAL" title="Terms and Conditions" intro="These terms explain how Ominet Digital's website, content, products and services may be used. By using the website or requesting a service you accept them.">
      <h2>1. Who we are</h2>
      <p>Ominet Digital is a Nigerian digital company working across publishing, media production, design, technology and professional services. Contact: <a href="mailto:info@ominetdigital.com.ng">info@ominetdigital.com.ng</a>.</p>
      <h2>2. Using the website</h2>
      <p>You may browse and read the public website for lawful, personal or business use. You must not attempt to disrupt it, gain unauthorised access, scrape private areas or submit unlawful, abusive or misleading material through its forms and comments.</p>
      <h2>3. Content and intellectual property</h2>
      <p>Unless stated otherwise, text, images, designs, books and other material on the website belong to Ominet Digital or its authors and contributors. You may share links and short quotations with attribution. Copying, republishing or selling content without written permission is not allowed.</p>
      <h2>4. Editorial content</h2>
      <p>Blog posts and articles are published for information and discussion. Opinion, review, sponsored and fictional pieces are labelled as such. Opinion is the author&apos;s interpretation and not established fact. Where a correction is made, it is noted on the piece.</p>
      <h2>5. Professional services</h2>
      <p>Services are provided on the basis of a quotation that sets out scope, price, timeline and conditions. A quotation request or acknowledgement is not a confirmed booking. Work begins once terms are agreed and any required deposit is recorded. Receipts are issued only after a payment has been recorded and verified.</p>
      <h2>6. NYSC and CAC related services</h2>
      <p>Ominet Digital is an independent business. It is not the National Youth Service Corps or the Corporate Affairs Commission, does not represent either body and has no government endorsement. Assistance is subject to eligibility, documentation and applicable procedures. Decisions rest with the relevant authorities. Stated processing times are estimates, not guarantees. Official charges are shown separately from our professional fees. We do not facilitate forged documents, impersonation, bribery or the bypassing of official procedures, and we never ask for your passwords, PINs or one-time codes.</p>
      <h2>7. Payments</h2>
      <p>Prices and fees are communicated before payment. Online card payments are processed by Paystack; we do not store card details.</p>
      <h2>8. Books and digital products</h2>
      <p>Purchases are for personal use unless a licence says otherwise. Third-party retailers such as Amazon and Selar apply their own terms.</p>
      <h2>9. Liability</h2>
      <p>We take care with the information we publish, but it is provided without warranty that it is complete or error-free. To the extent the law allows, Ominet Digital is not liable for losses arising from reliance on website content or from decisions made by third-party authorities.</p>
      <h2>10. Privacy and cookies</h2>
      <p>See our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie notice</Link>.</p>
      <h2>11. Changes and governing law</h2>
      <p>We may update these terms; the current version is always on this page. They are governed by the laws of the Federal Republic of Nigeria.</p>
    </LegalShell>
  );
}
