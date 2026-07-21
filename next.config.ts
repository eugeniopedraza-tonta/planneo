import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Solo en dev: permite optimizar imágenes servidas por Supabase local (127.0.0.1).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qfxgbjxwsvblsjbufppk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase local (supabase start) durante desarrollo
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
