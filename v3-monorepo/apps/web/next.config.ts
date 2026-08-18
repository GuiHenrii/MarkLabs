import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Permite que o Next.js aceite requisições de desenvolvimento do Ngrok
  allowedDevOrigins: ["shrine-dropbox-fidgety.ngrok-free.dev"],
  // Desabilitar restrições de host do Turbopack para permitir Ngrok em desenvolvimento
  experimental: {
    serverActions: {
      allowedOrigins: ["shrine-dropbox-fidgety.ngrok-free.dev", "localhost:3000"]
    }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://shrine-dropbox-fidgety.ngrok-free.dev",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
