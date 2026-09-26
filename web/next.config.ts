import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
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
  images: {
    // Lets next/image resize, re-encode and lazy-load covers/photos that
    // live in Supabase Storage instead of serving the original upload as-is.
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
