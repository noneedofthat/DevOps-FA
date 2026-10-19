import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;