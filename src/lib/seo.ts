import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const SITE_NAME = 'Planneo'

/** Imagen de marca genérica (src/app/opengraph-image.tsx), 1200×630. */
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Planneo — Proveedores verificados para tu evento en Monterrey',
} as const

type OgImage = { url: string; width?: number; height?: number; alt?: string }

type PageMetadataInput = {
  /** Título sin sufijo de marca: el template "%s | Planneo" del layout lo agrega. */
  title: string
  description: string
  /** Ruta relativa canónica, p. ej. `/musica`. */
  path: string
  /** Imagen propia (foto del proveedor, portada de categoría). Sin ella, la de marca. */
  image?: OgImage | null
  /** Usa el título tal cual, sin template (home). */
  absoluteTitle?: boolean
}

/**
 * Metadata completa de una página pública: canonical, Open Graph y Twitter.
 *
 * Next reemplaza (no fusiona) el objeto `openGraph` del padre cuando la página
 * declara el suyo, así que cada página debe traer siteName, locale e imágenes
 * completos. Por eso todas pasan por aquí.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const ogTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`
  const images = [image ?? DEFAULT_OG_IMAGE]

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'es_MX',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: images.map((img) => img.url),
    },
  }
}
