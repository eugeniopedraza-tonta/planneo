import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 301 explícito (no `permanent: true`, que en Next es 308).
  async redirects() {
    return [
      { source: '/fotografia', destination: '/foto-video', statusCode: 301 },
      { source: '/fotografia/:slug', destination: '/foto-video/:slug', statusCode: 301 },
      { source: '/salones', destination: '/lugares', statusCode: 301 },
      { source: '/salones/:slug', destination: '/lugares/:slug', statusCode: 301 },
      // El catálogo del organizador vive en /catalogo; /proveedores confundía
      // con la landing de captación (/para-proveedores). PLA-24.
      { source: '/proveedores', destination: '/catalogo', statusCode: 301 },
    ]
  },
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
