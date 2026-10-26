import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:5000"}/api/:path*`,
      },
      {
        source: "/api/events",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:5000"}/api/events`,
      },
      {
        source: "/api/admin/totp-info",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:5000"}/api/admin/totp-info`,
      },
    ];
  },
};


export default nextConfig;