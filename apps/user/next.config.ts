import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Compile the shared workspace package as part of this app's build.
  transpilePackages: ["@repo/ui"],
  // Keep the native MongoDB driver out of the bundle; load it at runtime.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
