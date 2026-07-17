import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "tesseract.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
