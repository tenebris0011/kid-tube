import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "videos.wilsoncode.space",
        pathname: "/**",
      },
      // Invidious proxies YouTube thumbnails from these domains
      {
        protocol: "https",
        hostname: "**.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ggpht.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
