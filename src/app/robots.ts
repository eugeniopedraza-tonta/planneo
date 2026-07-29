import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/fotografia',
          '/belleza',
          '/musica',
          '/banquete',
          '/decoracion',
          '/buscar',
          '/para-proveedores',
        ],
        disallow: [
          '/admin',
          '/reclamar',
          '/mi-perfil',
          '/api',
          '/login',
          '/consulta',
          '/panel',
          '/verificar-acceso',
          '/registrarme/gracias',
        ],
      },
    ],
    sitemap: 'https://planneo.mx/sitemap.xml',
  }
}
