import { absoluteUrl } from '@/lib/site-url'
import { toWhatsAppDigits } from '@/lib/whatsapp'

/**
 * Datos estructurados schema.org. Los builders devuelven objetos planos; el
 * componente <JsonLd> (src/components/json-ld.tsx) los serializa con
 * `serializeJsonLd`, que escapa `<` para que ningún valor cierre el <script>.
 */
export type JsonLdObject = { '@context': 'https://schema.org'; '@type': string } & Record<string, unknown>

/** JSON.stringify con `<` → < (recomendación de la guía JSON-LD de Next). */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export type BreadcrumbItem = { name: string; path: string }

/** BreadcrumbList: Inicio → Categoría → Proveedor. Las rutas son relativas al sitio. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

type LocalBusinessInput = {
  name: string
  path: string
  description?: string | null
  zona?: string | null
  photos?: string[] | null
  priceRange?: string | null
  /** Celular público del proveedor; solo se publica si es válido. */
  phone?: string | null
  instagramHandle?: string | null
}

export function localBusinessJsonLd(p: LocalBusinessInput): JsonLdObject {
  const digits = p.phone ? toWhatsAppDigits(p.phone) : null
  const instagram = p.instagramHandle?.replace(/[^a-zA-Z0-9._]/g, '')
  const mainPhoto = p.photos?.[0]

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.name,
    url: absoluteUrl(p.path),
    ...(p.description ? { description: p.description } : {}),
    ...(mainPhoto ? { image: [mainPhoto] } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.zona || 'Monterrey',
      addressRegion: 'Nuevo León',
      addressCountry: 'MX',
    },
    ...(p.priceRange ? { priceRange: p.priceRange } : {}),
    ...(digits ? { telephone: `+${digits}` } : {}),
    ...(instagram ? { sameAs: [`https://instagram.com/${instagram}`] } : {}),
  }
}

/** FAQPage, para las preguntas frecuentes de categoría. */
export function faqPageJsonLd(faqs: { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}
