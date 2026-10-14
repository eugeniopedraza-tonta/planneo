import type { CategoryContent } from '../../content/categories'

/**
 * Bloque editorial "Cómo elegir tu … en Monterrey" + preguntas frecuentes de
 * una categoría. Server component: se renderiza en el HTML aunque no haya
 * proveedores publicados.
 */
export default function CategoryEditorial({ content }: { content: CategoryContent }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="categoria-guia" className="max-w-3xl">
        <h2
          id="categoria-guia"
          className="v4-display text-xl font-bold tracking-[-0.03em] text-white sm:text-2xl"
        >
          {content.editorialTitle}
        </h2>
        <div className="mt-4 space-y-4 text-base leading-7 text-white/65">
          {content.editorial.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <CategoryFaq faqs={content.faqs} />
    </div>
  )
}

function CategoryFaq({ faqs }: { faqs: CategoryContent['faqs'] }) {
  if (faqs.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <section aria-labelledby="categoria-faq" className="max-w-3xl">
      <h2
        id="categoria-faq"
        className="v4-display text-xl font-bold tracking-[-0.03em] text-white sm:text-2xl"
      >
        Preguntas frecuentes
      </h2>
      <div className="mt-4 divide-y divide-white/10 rounded-[20px] border border-white/10 bg-white/[0.03]">
        {faqs.map((faq) => (
          <details key={faq.question} className="group px-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 [&::-webkit-details-marker]:hidden">
              {faq.question}
              <svg
                className="size-4 shrink-0 text-white/50 transition-transform group-open:rotate-45"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="pb-5 text-sm leading-6 text-white/60">{faq.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </section>
  )
}
