import type { Metadata } from "next";
import Script from "next/script";
import Analytics from "@/components/Analytics";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export async function generateMetadata(): Promise<Metadata> {
  const { identity, seo } = await getSiteSettings();
  return {
    // Pages give a short title; the site name is added here in one place.
    title: { default: identity.siteName, template: `%s — ${identity.siteName}` },
    description: identity.description,
    openGraph: { siteName: identity.siteName, ...(seo.defaultOgImageUrl ? { images: [seo.defaultOgImageUrl] } : {}) },
    ...(seo.faviconUrl ? { icons: { icon: seo.faviconUrl } } : {}),
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
  const { social, identity, contact } = await getSiteSettings();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <Analytics />
        {/* Only links that are switched on are handed to the browser — hidden ones never appear in the page source. */}
        <SiteSettingsProvider value={{ social: social.filter((s) => s.enabled && s.url), siteName: identity.siteName, whatsapp: contact.whatsapp }}>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
