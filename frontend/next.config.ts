import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: "illegal path" errors with Turbopack on Windows/Docker are often harmless
  // and don't affect functionality. If they persist, you can disable Turbopack by
  // running: npm run dev -- --no-turbo
  
  // Make build more lenient for production
  typescript: {
    // Don't fail build on TypeScript errors during build (warnings only)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't fail build on ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
