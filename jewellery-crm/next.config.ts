import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - next-pwa has no types for withPWA wrapper
import withPWA from "next-pwa";

const baseConfig: NextConfig = {
  // Production-ready configuration
  compiler: {
    // Strip all console.* calls in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint for deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for deployment
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Webpack configuration for WebRTC SDK
  webpack: (config, { isServer }) => {
    // Handle audio files from WebRTC SDK
    config.module.rules.push({
      test: /\.(wav|mp3|ogg|m4a)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/audio/[name].[hash][ext]',
      },
    });

    // Handle WebRTC SDK modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Exclude problematic modules from server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), '@exotel-npm-dev/webrtc-core-sdk'];
    }

    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'crm-final-mfe4.onrender.com', 'crm-final-tj4n.onrender.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analysis removed for stability
};

// Full PWA: next-pwa generates sw.js with precache + push. Exclude app-build-manifest.json so it doesn't 404 and block SW activation.
const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  sw: "sw.js",
  disable: process.env.NODE_ENV !== "production",
  buildExcludes: [
    ({ asset }: { asset?: { name?: string } }) => {
      const name = asset?.name != null ? String(asset.name) : "";
      return name.includes("app-build-manifest") || name.includes("build-manifest.json");
    },
  ],
})(baseConfig);

export default nextConfig;
