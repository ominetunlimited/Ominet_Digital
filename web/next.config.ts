import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Media Library / cover / thumbnail uploads go through Server Actions
    // as FormData; the framework default (1MB) is too small for photos.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
