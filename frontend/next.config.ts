import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
  }
};

export default nextConfig;
