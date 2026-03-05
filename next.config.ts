import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Permitir que /widget sea embebible via iframe
  async headers() {
    return [
      {
        source: "/widget/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
  // Configuración para @react-pdf/renderer en serverless
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
