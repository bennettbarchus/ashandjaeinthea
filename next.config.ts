import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.127"],
  // A package-lock.json in a parent directory (outside this project) was
  // causing Turbopack to infer the wrong workspace root, which in turn
  // broke Tailwind v4's automatic content scanning (no utility classes
  // were being generated at all). Pinning the root here fixes both.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
