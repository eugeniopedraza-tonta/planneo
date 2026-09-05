import { normalizeTestimonials } from '@/lib/testimonials'
import type { ProviderTestimonial } from '@/lib/types'

export default function ProviderTestimonialsSection({
  testimonials,
}: {
  testimonials: ProviderTestimonial[] | null | undefined
}) {
  const items = normalizeTestimonials(testimonials)
  if (items.length === 0) return null

  return (
    <section className="py-8">
      <h2 className="v4-display text-2xl font-bold tracking-[-0.04em] text-white">
        Lo que dicen de ellos
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={`${item.quote}-${index}`}>
            <blockquote className="v4-glass h-full rounded-[24px] p-5">
              <p className="font-serif text-3xl leading-none text-planneo-gold/70" aria-hidden>
                “
              </p>
              <p className="mt-2 leading-7 text-white/80">
                {item.quote}
              </p>
              {item.author ? (
                <footer className="mt-4 text-sm text-white/55">{item.author}</footer>
              ) : null}
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  )
}
