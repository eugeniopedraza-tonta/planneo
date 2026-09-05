import { z } from 'zod'
import type { ProviderTestimonial } from '@/lib/types'

export const MAX_PROVIDER_TESTIMONIALS = 6

const TestimonialSchema = z.object({
  quote: z.string().trim().min(1).max(500),
  author: z.string().trim().max(80).nullable(),
})

/** Descarta citas vacías o mal formadas y recorta a 6. */
export function normalizeTestimonials(value: unknown): ProviderTestimonial[] {
  if (!Array.isArray(value)) return []

  const items: ProviderTestimonial[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const quote = 'quote' in raw && typeof raw.quote === 'string' ? raw.quote.trim() : ''
    if (!quote) continue
    const author =
      'author' in raw && typeof raw.author === 'string' ? raw.author.trim() : ''
    items.push({
      quote: quote.slice(0, 500),
      author: author ? author.slice(0, 80) : null,
    })
    if (items.length >= MAX_PROVIDER_TESTIMONIALS) break
  }
  return items
}

export function parseTestimonialsFromFormData(
  formData: FormData
): { ok: true; testimonials: ProviderTestimonial[] } | { ok: false; error: string } {
  const items: ProviderTestimonial[] = []
  for (let i = 0; i < MAX_PROVIDER_TESTIMONIALS; i++) {
    const quote = String(formData.get(`testimonial_quote_${i}`) ?? '').trim()
    if (!quote) continue
    const author = String(formData.get(`testimonial_author_${i}`) ?? '').trim()
    items.push({ quote, author: author || null })
  }

  const parsed = z.array(TestimonialSchema).safeParse(items)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los testimonios: la cita máximo 500 caracteres y el autor 80.',
    }
  }
  return { ok: true, testimonials: parsed.data }
}
