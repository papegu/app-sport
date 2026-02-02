import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ih1.redbubble.net',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/members",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
