import type { CategorySlug } from '@/lib/constants'

/**
 * Contenido editorial de una página de categoría (`www.planneo.com.mx/{slug}`).
 * Autor oficial: Gus. Mientras `draft` sea `true`, el texto es un borrador
 * que se publica igual pero está pendiente de su revisión. `draft` y
 * `authorNote` nunca se renderizan.
 */
export type CategoryContent = {
  slug: CategorySlug
  draft: boolean
  authorNote: string
  /** "Cómo elegir tu … en Monterrey" */
  editorialTitle: string
  /** Párrafos en texto plano, 200–400 palabras en total. */
  editorial: string[]
  /** 3–5 preguntas. Alimentan el acordeón y el JSON-LD FAQPage. */
  faqs: { question: string; answer: string }[]
}

export const DRAFT_NOTE = 'Borrador — pendiente de revisión de Gus'
