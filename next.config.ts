import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
