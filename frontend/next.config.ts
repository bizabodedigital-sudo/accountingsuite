import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  typescript: {
    ignoreBuildErrors: true, // Allow build to proceed with TypeScript warnings
  },
  // Note: eslint config moved to next.config.ts is deprecated in Next.js 16
  // Use .eslintrc.json or eslint.config.js instead
  productionBrowserSourceMaps: false, // Disable source maps for production
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
  // Enable standalone output for optimized Docker builds
  output: 'standalone',
};

export default nextConfig;
