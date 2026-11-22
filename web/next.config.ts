import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const isProd = process.env.NODE_ENV === "production";
const adsenseOn = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

/**
 * Content Security Policy. Inline scripts have to stay allowed: a nonce would
 * force every page to render per-request, which removes static generation and
 * caching from the public site (Next's own docs spell this trade-off out).
 * Everything else is locked down — no plugins, no <base> hijacking, no framing,
 * forms and fetches only to ourselves, Supabase (uploads) and Paystack.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${adsenseOn ? " https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${supabaseOrigin}${adsenseOn ? " https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com" : ""}`.trim(),
  // Embeds the owner can add to portfolio items (videos, slides). Nothing else may be framed.
  adsenseOn
    ? "frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.canva.com"
    : "frame-src https://docs.google.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.canva.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Vercel serves everything over https; locally (http) this would break the app.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PDF cover rendering uses a native canvas and pdf.js's worker/font files,
  // which must be loaded from node_modules at runtime rather than bundled.
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/admin/**": ["./node_modules/pdfjs-dist/standard_fonts/**", "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  experimental: {
    // Media Library / cover / thumbnail uploads go through Server Actions
    // as FormData; the framework default (1MB) is too small for photos.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    // The Writing section is now Articles. Permanent, so search engines transfer the old URLs.
    return [
      { source: "/writing", destination: "/articles", permanent: true },
      { source: "/writing/:slug", destination: "/articles/:slug", permanent: true },
    ];
  },
  async headers() {
    // Development keeps the framework's own relaxed behaviour (React needs
    // eval there); the policy is enforced in production builds.
    if (!isProd) return [];
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The admin is private: never cached, never indexed.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  images: {
    // Lets next/image resize, re-encode and lazy-load covers/photos that
    // live in Supabase Storage instead of serving the original upload as-is.
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
