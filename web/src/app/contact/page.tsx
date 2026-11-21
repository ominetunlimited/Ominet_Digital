import Link from "next/link";
import LegalShell from "@/components/LegalShell";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

export const generateMetadata = () => pageMetadata(
  "Contact Ominet Digital",
  "Contact Ominet Digital by email or WhatsApp, or send a detailed project enquiry for a quotation.",
  "/contact"
);

export default async function ContactPage() {
  const { contact } = await getSiteSettings();
  const email = contact.supportEmail || "info@ominetdigital.com.ng";
  return (
    <LegalShell eyebrow="CONTACT" title="Contact Ominet Digital" intro="Reach us directly, or tell us about your project and we will respond with the next steps.">
      <h2>Email</h2>
      <p><a href={`mailto:${email}`}>{email}</a></p>
      <h2>WhatsApp</h2>
      <p><a href="https://wa.me/2349026057899" target="_blank" rel="noopener noreferrer">+234 902 605 7899</a>. Messages sent by WhatsApp are not stored in our admin system; for a formal record, use the project enquiry form.</p>
      <h2>Project enquiries and quotations</h2>
      <p>For writing, research, publishing, design, media or other services, use the <Link href="/discuss-a-project">project enquiry form</Link>. You receive a reference number and an acknowledgement email.</p>
      <h2>Website</h2>
      <p><a href="https://www.ominetdigital.com.ng">https://www.ominetdigital.com.ng</a></p>
      <p>Please do not send passwords, PINs or one-time codes by any channel. We never need them.</p>
    </LegalShell>
  );
}
