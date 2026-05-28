import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/fotografia', '/belleza', '/musica', '/banquete', '/decoracion', '/buscar'],
        disallow: ['/admin', '/reclamar', '/mi-perfil', '/api', '/login'],
      },
    ],
    sitemap: 'https://planneo.mx/sitemap.xml',
  }
}
