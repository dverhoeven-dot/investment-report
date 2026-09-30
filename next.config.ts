import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reports use ordinary <img> tags. Disable the anonymous optimizer route.
  images: { unoptimized: true },
};

export default nextConfig;
