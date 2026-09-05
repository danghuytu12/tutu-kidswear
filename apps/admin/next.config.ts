import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui"],
  // Keep the native MongoDB driver and the xlsx reader out of the bundle; both
  // rely on Node internals and are loaded at runtime instead.
  serverExternalPackages: ["mongodb", "exceljs"],
};

export default nextConfig;
