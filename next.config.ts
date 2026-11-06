import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uji e2e memakai folder build terpisah (NEXT_DIST_DIR=.next-e2e) agar tidak bentrok
  // dengan `npm run dev` yang mungkin sedang berjalan.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
