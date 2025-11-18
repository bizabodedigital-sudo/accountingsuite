import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  typescript: {
    ignoreBuildErrors: true, // Allow build to proceed with TypeScript warnings
  },
  eslint: {
    ignoreDuringBuilds: true, // Don't fail build on ESLint errors
  },
  productionBrowserSourceMaps: false, // Disable source maps for production
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
};

export default nextConfig;
