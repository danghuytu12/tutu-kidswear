import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Compile the shared workspace package as part of this app's build.
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
