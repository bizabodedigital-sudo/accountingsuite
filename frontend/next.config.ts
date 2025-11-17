import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: "illegal path" errors with Turbopack on Windows/Docker are often harmless
  // and don't affect functionality. If they persist, you can disable Turbopack by
  // running: npm run dev -- --no-turbo
};

export default nextConfig;
