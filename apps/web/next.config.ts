import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@leakops/shared"],
};

export default nextConfig;
