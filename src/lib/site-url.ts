/**
 * Origen canónico del sitio. Todo lo que publica URLs absolutas (canonical,
 * sitemap, robots, Open Graph, JSON-LD, correos) sale de aquí.
 * Se configura con NEXT_PUBLIC_SITE_URL; sin barra final.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.planneo.com.mx').replace(
  /\/+$/,
  ''
)

/** URL absoluta para una ruta del sitio (`/musica` → `https://…/musica`). */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized === '/' ? SITE_URL : `${SITE_URL}${normalized}`
}
