import type { Metadata } from "next";
import Analytics from "@/components/Analytics";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import NewsletterFloat from "@/components/NewsletterFloat";
import { countPublishedPortfolio } from "@/lib/portfolio";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export async function generateMetadata(): Promise<Metadata> {
  const { identity, seo } = await getSiteSettings();
  return {
    // Absolute URLs (canonical, share images) always resolve to the real domain.
    metadataBase: new URL(SITE_URL),
    // Pages give a short title; the site name is added here in one place.
    title: { default: identity.siteName, template: `%s | ${identity.siteName}` },
    description: identity.description,
    openGraph: { siteName: identity.siteName, ...(seo.defaultOgImageUrl ? { images: [seo.defaultOgImageUrl] } : {}) },
    manifest: "/site.webmanifest",
    icons: seo.faviconUrl
      ? { icon: seo.faviconUrl }
      : {
          icon: [
            { url: "/favicon.ico", type: "image/x-icon" },
            { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
            { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
          ],
          apple: "/apple-touch-icon.png",
        },
    ...(seo.googleVerification ? { verification: { google: seo.googleVerification } } : {}),
  };
}

const THEME_INIT = `
try {
  var t = localStorage.getItem('omd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { social, identity, contact, pages, ecosystem } = await getSiteSettings();
  const workCount = await countPublishedPortfolio();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {ADSENSE_CLIENT_ID && (
          // Plain tag, exactly as Google supplies it, so it is present in the raw HTML <head> of every page (what AdSense site verification reads).
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`} crossOrigin="anonymous" />
        )}
      </head>
      <body>
        <Analytics />
        {/* Only links that are switched on are handed to the browser — hidden ones never appear in the page source. */}
        <SiteSettingsProvider value={{ social: social.filter((s) => s.enabled && s.url), siteName: identity.siteName, whatsapp: contact.whatsapp, logoUrl: identity.logoUrl, pages, products: { profile: ecosystem.profileVisible, cortexa: ecosystem.cortexaVisible, work: workCount > 0 } }}>
          {children}
          <NewsletterFloat />
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
