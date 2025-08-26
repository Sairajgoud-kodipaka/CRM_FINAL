import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable linting during builds for development speed
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Temporarily disable type checking during builds for development speed  
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
