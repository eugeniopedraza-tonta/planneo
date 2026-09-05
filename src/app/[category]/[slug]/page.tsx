import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600
export const dynamicParams = true
import { EVENT_TYPE_LABELS, isCategorySlug } from '@/lib/constants'
import QuoteRequestForm from '@/components/quote-request-form'
import ProfileViewTracker from '@/components/profile-view-tracker'
import ProviderPhotoGallery from '@/components/provider-photo-gallery'
import ProviderPackagesSection from '@/components/provider-packages-section'
import ProviderTestimonialsSection from '@/components/provider-testimonials-section'
import PublicAvailabilityCalendar from '@/components/public-availability-calendar'
import WhatsAppButton from '@/components/whatsapp-button'
import Navbar from '@/components/landing/Navbar'
import { isInquiriesEnabled } from '@/lib/feature-flags'
import type { ProviderWithCategory, PublicAvailability, ServicePackage } from '@/lib/types'

interface PageProps {
  params: Promise<{ category: string; slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function getProvider(slug: string, preview = false): Promise<ProviderWithCategory | null> {
  const supabase = preview ? await createClient() : createStaticClient()
  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('slug', slug)

  if (!preview) {
    query = query.eq('status', 'published')
  }

  const { data } = await query.single()

  return (data as ProviderWithCategory) ?? null
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('providers')
    .select('slug, categories(slug)')
    .eq('status', 'published')
    .limit(200)

  if (!data) return []

  return data
    .filter((p) => {
      const cats = p.categories
      return cats && !Array.isArray(cats) && (cats as { slug: string }).slug
    })
    .map((p) => ({
      category: (p.categories as unknown as { slug: string }).slug,
      slug: p.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const provider = await getProvider(slug)
  if (!provider) return {}

  const title = `${provider.name} — ${provider.categories?.name ?? ''} en Monterrey | Planneo`
  const description =
    provider.description ??
    `Conoce a ${provider.name}, proveedor de ${provider.categories?.name?.toLowerCase() ?? 'eventos'} en ${provider.zona ?? 'Monterrey'}. Contáctalos directamente desde Planneo.`

  const images = provider.photos?.[0]
    ? [{ url: provider.photos[0], width: 1200, height: 630, alt: provider.name }]
    : []

  return {
    title,
    description,
    alternates: { canonical: `/${provider.categories?.slug ?? ''}/${provider.slug}` },
    openGraph: {
      title,
      description,
      locale: 'es_MX',
      type: 'website',
      images,
    },
  }
}

const EVENT_LABEL: Record<string, string> = EVENT_TYPE_LABELS

const PRICE_LABEL: Record<string, string> = {
  '$': '$ · Económico',
  '$$': '$$ · Intermedio',
  '$$$': '$$$ · Premium',
}

export default async function ProviderProfilePage({ params, searchParams }: PageProps) {
  const { category, slug } = await params
  const { preview } = await searchParams

  if (!isCategorySlug(category)) {
    notFound()
  }

  const isPreview = preview === 'true'
  const provider = await getProvider(slug, isPreview)
  if (!provider) notFound()

  const publicData = createStaticClient()
  const [{ data: packages }, { data: availability }] = await Promise.all([
    publicData
      .from('service_packages')
      .select('*')
      .eq('provider_id', provider.id)
      .order('is_featured', { ascending: false })
      .order('sort_order')
      .returns<ServicePackage[]>(),
    publicData
      .from('public_provider_availability')
      .select('*')
      .eq('provider_id', provider.id)
      .gte('date', new Date().toISOString().slice(0, 10))
      .returns<PublicAvailability[]>(),
  ])

  // Verify URL category matches actual category
  if (provider.categories?.slug && provider.categories.slug !== category) {
    notFound()
  }

  // Build JSON-LD from known scalar values only.
  // JSON.stringify produces valid JSON; we only risk XSS if a value itself
  // contained </script> — we neutralise that with a targeted replace.
  const jsonLdObj = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.name,
    ...(provider.description ? { description: provider.description } : {}),
    ...(provider.photos && provider.photos.length > 0 ? { image: provider.photos } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.zona ?? 'Monterrey',
      addressRegion: 'Nuevo León',
      addressCountry: 'MX',
    },
    ...(provider.instagram_handle
      ? { sameAs: [`https://instagram.com/${provider.instagram_handle.replace(/[^a-zA-Z0-9._]/g, '')}`] }
      : {}),
  }
  // Escape </script> to prevent early tag closure
  const jsonLd = JSON.stringify(jsonLdObj).replace(/<\/script>/gi, '<\\/script>')

  return (
    <>
      {!isPreview && (
        <ProfileViewTracker
          providerId={provider.id}
          providerName={provider.name}
          category={provider.categories?.slug}
        />
      )}

      <script
        type="application/ld+json"
        // Content is JSON.stringify output with </script> escaped — safe for inline use
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="min-h-screen bg-planneo-950 pb-28 text-planneo-ink lg:pb-0">
        <Navbar />
        {isPreview && (
          <div className="bg-[#2F241D] px-4 py-2 pt-20 text-center text-sm font-medium text-white">
            Vista previa admin. Este perfil puede no estar publicado.
          </div>
        )}

        <div className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${isPreview ? 'pt-6' : 'pt-24'}`}>
          {/* Breadcrumb */}
          <nav className="text-sm text-white/45" aria-label="Migas de pan">
            <Link href="/" className="transition-colors hover:text-planneo-300">
              Inicio
            </Link>
            <span className="mx-2 text-white/20">/</span>
            <Link href={`/${category}`} className="transition-colors hover:text-planneo-300">
              {provider.categories?.name}
            </Link>
            <span className="mx-2 text-white/20">/</span>
            <span className="font-medium text-white/70">{provider.name}</span>
          </nav>

          {/* Título arriba de la galería, estilo Airbnb */}
          <header className="mt-4">
            <h1 className="v4-display text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
              {provider.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-white/60">
              {provider.is_verified && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-planneo-mint">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Verificado por Planneo
                  </span>
                  <span aria-hidden="true" className="text-white/25">·</span>
                </>
              )}
              {provider.categories && <span>{provider.categories.name}</span>}
              {provider.zona && (
                <>
                  <span aria-hidden="true" className="text-white/25">·</span>
                  <span>{provider.zona}, Monterrey</span>
                </>
              )}
              {provider.price_range && (
                <>
                  <span aria-hidden="true" className="text-white/25">·</span>
                  <span>{PRICE_LABEL[provider.price_range] ?? provider.price_range}</span>
                </>
              )}
            </div>
          </header>

          {/* Galería estilo Airbnb */}
          {provider.photos && provider.photos.length > 0 && (
            <div className="mt-5">
              <ProviderPhotoGallery name={provider.name} photos={provider.photos} />
            </div>
          )}

          <div className="mt-2 flex flex-col gap-10 lg:flex-row lg:gap-16">
            {/* Contenido principal: secciones separadas por divisores */}
            <article className="min-w-0 flex-1 divide-y divide-white/10">
              {/* Highlights rápidos */}
              <section className="space-y-5 py-8">
                {provider.is_verified && (
                  <div className="flex items-start gap-4">
                    <svg className="mt-0.5 size-6 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Proveedor verificado</p>
                      <p className="mt-0.5 text-sm text-white/55">
                        Identidad y contacto validados por el equipo de Planneo.
                      </p>
                    </div>
                  </div>
                )}
                {provider.zona && (
                  <div className="flex items-start gap-4">
                    <svg className="mt-0.5 size-6 shrink-0 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Zona de servicio</p>
                      <p className="mt-0.5 text-sm text-white/55">{provider.zona} y alrededores.</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <svg className="mt-0.5 size-6 shrink-0 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 12h8M8 8h8M8 16h5" />
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                  </svg>
                  <div>
                    {isInquiriesEnabled() ? (
                      <>
                        <p className="font-semibold text-white">Cotización sin costo</p>
                        <p className="mt-0.5 text-sm text-white/55">
                          Pide precio y disponibilidad sin compromiso, todo dentro de Planneo.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-white">Contacto directo por WhatsApp</p>
                        <p className="mt-0.5 text-sm text-white/55">
                          Escríbeles para resolver precio y disponibilidad en minutos.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Descripción */}
              {provider.description && (
                <section className="py-8">
                  <h2 className="v4-display text-2xl font-bold tracking-[-0.04em] text-white">
                    Acerca de {provider.name}
                  </h2>
                  <p className="mt-4 whitespace-pre-line leading-7 text-white/70">
                    {provider.description}
                  </p>
                </section>
              )}

              {/* Tipos de evento */}
              {provider.event_types && provider.event_types.length > 0 && (
                <section className="py-8">
                  <h2 className="v4-display text-2xl font-bold tracking-[-0.04em] text-white">
                    Ideal para estos eventos
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.event_types.map((type) => (
                      <span
                        key={type}
                        className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/80"
                      >
                        {EVENT_LABEL[type] ?? type}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <ProviderTestimonialsSection testimonials={provider.testimonials} />

              {/* Paquetes con "Agregar a mi evento" */}
              <ProviderPackagesSection
                provider={{
                  id: provider.id,
                  name: provider.name,
                  slug: provider.slug,
                  categorySlug: provider.categories?.slug ?? category,
                }}
                packages={packages ?? []}
                availability={availability ?? []}
              />

              {/* Calendario readonly */}
              <PublicAvailabilityCalendar availability={availability ?? []} />
            </article>

            {/* Sidebar de cotización, estilo tarjeta de reserva */}
            <aside id="cotizar" className="shrink-0 scroll-mt-24 lg:w-96">
              <div className="v4-glass sticky top-24 space-y-4 rounded-[24px] p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    {provider.price_range ? (
                      <>
                        <p className="v4-display text-2xl font-bold tracking-[-0.02em] text-white">
                          {provider.price_range}
                          <span className="ml-2 text-sm font-normal text-white/55">
                            {PRICE_LABEL[provider.price_range]?.split('· ')[1] ?? ''}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-white/50">Rango de precios del proveedor</p>
                      </>
                    ) : (
                      <p className="v4-display text-xl font-bold tracking-[-0.02em] text-white">
                        Precio a consultar
                      </p>
                    )}
                  </div>
                  {provider.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-planneo-mint/30 bg-planneo-mint/10 px-2.5 py-1 text-xs font-medium text-planneo-mint">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Verificado
                    </span>
                  )}
                </div>

                {isInquiriesEnabled() ? (
                  <>
                    <QuoteRequestForm providerId={provider.id} />
                    <p className="text-center text-xs text-white/50">
                      Gratis y sin compromiso. Aún no se te cobra nada.
                    </p>
                    <ul className="space-y-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/55">
                      <li className="flex items-start gap-2">
                        <svg className="mt-0.5 size-3.5 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Respuesta del proveedor directamente en Planneo.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="mt-0.5 size-3.5 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Tus datos solo se comparten con este proveedor.
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    {provider.phone && (
                      <WhatsAppButton
                        providerId={provider.id}
                        phone={provider.phone}
                        providerName={provider.name}
                      />
                    )}
                    <ul className="space-y-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/55">
                      <li className="flex items-start gap-2">
                        <svg className="mt-0.5 size-3.5 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Respuesta directa del proveedor por WhatsApp.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="mt-0.5 size-3.5 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Sin cuenta ni compromiso. Planneo no intermedia el chat.
                      </li>
                    </ul>
                  </>
                )}

                {provider.instagram_handle && (
                  <a
                    href={`https://instagram.com/${provider.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-planneo-300"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                    </svg>
                    @{provider.instagram_handle}
                  </a>
                )}

                <p className="border-t border-white/10 pt-3 text-xs text-white/50">
                  Al contactar aceptas nuestros{' '}
                  <Link href="/terminos" className="underline transition hover:text-planneo-300">
                    términos de uso
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Barra CTA fija en móvil, estilo Airbnb */}
        <div className="v4-glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {provider.price_range
                ? PRICE_LABEL[provider.price_range] ?? provider.price_range
                : 'Precio a consultar'}
            </p>
            <p className="text-xs text-white/55">
              {isInquiriesEnabled()
                ? 'Cotiza gratis y sin compromiso'
                : 'Escríbeles por WhatsApp'}
            </p>
          </div>
          {isInquiriesEnabled() ? (
            <a
              href="#cotizar"
              className="v4-cta-glow inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-[14px] bg-planneo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
            >
              Solicitar cotización
            </a>
          ) : provider.phone ? (
            <WhatsAppButton
              providerId={provider.id}
              phone={provider.phone}
              providerName={provider.name}
              className="v4-cta-glow inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-planneo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
            >
              Escribir por WhatsApp
            </WhatsAppButton>
          ) : null}
        </div>
      </div>
    </>
  )
}
