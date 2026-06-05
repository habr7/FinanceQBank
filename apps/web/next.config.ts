import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@charterbank/shared", "@charterbank/db", "@charterbank/ai-content"],
};

export default nextConfig;
