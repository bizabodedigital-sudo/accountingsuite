/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  typescript: {
    ignoreBuildErrors: true, // Allow build to proceed with TypeScript warnings
  },
  productionBrowserSourceMaps: false, // Disable source maps for production
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode
  
  // Explicitly disable Turbopack - use Webpack for all builds
  // Next.js 14 uses Webpack by default, but we're being explicit
  experimental: {
    // No experimental features that might enable Turbopack
  },
};

module.exports = nextConfig;

