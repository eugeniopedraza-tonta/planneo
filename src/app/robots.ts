import type { MetadataRoute } from 'next'
import { CATEGORY_SLUGS } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          ...CATEGORY_SLUGS.map((slug) => `/${slug}`),
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
