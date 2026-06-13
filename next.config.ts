import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.stockbit.com",
        pathname: "/logos/**",
      },
      {
        protocol: "https",
        hostname: "pasardana.id",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
