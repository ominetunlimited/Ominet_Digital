import Link from "next/link";
import LegalShell from "@/components/LegalShell";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata(
  "Cookie and Advertising Notice",
  "The cookies and similar technologies used on the Ominet Digital website, including advertising where enabled.",
  "/cookies"
);

export default function CookiesPage() {
  const adsOn = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
  return (
    <LegalShell eyebrow="LEGAL" title="Cookie and Advertising Notice" intro="This notice lists the cookies and similar technologies the website uses, and why.">
      <h2>Essential</h2>
      <ul>
        <li><strong>Sign-in session</strong>: keeps you signed in to your account or the admin area.</li>
        <li><strong>Anonymous visitor key</strong>: a random identifier that lets the site remember likes and similar actions without an account.</li>
        <li><strong>Theme preference</strong>: your light or dark choice, kept in your browser&apos;s local storage.</li>
      </ul>
      <h2>Analytics</h2>
      <p>The website records page views and a few actions (searches, shares, outbound clicks) in our own database to understand what is useful. We do not use this to identify you personally.</p>
      <h2>Advertising</h2>
      {adsOn ? (
        <p>This website displays ads served through Google AdSense. Google, as a third-party vendor, uses cookies to serve ads based on your visits to this and other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to you. You can manage personalised advertising in <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a> or learn about opting out at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. Advertising is always labelled and kept separate from editorial content, and is not shown on enquiry, payment or account pages.</p>
      ) : (
        <p>No third-party advertising is currently being served. If it is enabled in future, this notice will be updated before it begins, and ads will be labelled and kept off enquiry, payment and account pages.</p>
      )}
      <h2>Your choices</h2>
      <p>You can block or delete cookies in your browser settings; essential features such as sign-in may then stop working. More detail is in our <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalShell>
  );
}
