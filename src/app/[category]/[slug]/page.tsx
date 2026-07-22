import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient, createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600
export const dynamicParams = true
import { CATEGORY_SLUGS } from '@/lib/constants'
import QuoteRequestForm from '@/components/quote-request-form'
import ProfileViewTracker from '@/components/profile-view-tracker'
import ProviderPackagesSection from '@/components/provider-packages-section'
import PublicAvailabilityCalendar from '@/components/public-availability-calendar'
import Navbar from '@/components/landing/Navbar'
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
    query = query.in('status', ['published', 'claimed'])
  }

  const { data } = await query.single()

  return (data as ProviderWithCategory) ?? null
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('providers')
    .select('slug, categories(slug)')
    .in('status', ['published', 'claimed'])
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

const EVENT_LABEL: Record<string, string> = {
  bodas: 'Bodas',
  xv: 'XV Años',
  corporativo: 'Corporativo',
  graduacion: 'Graduación',
}

const PRICE_LABEL: Record<string, string> = {
  '$': '$ · Económico',
  '$$': '$$ · Intermedio',
  '$$$': '$$$ · Premium',
}

export default async function ProviderProfilePage({ params, searchParams }: PageProps) {
  const { category, slug } = await params
  const { preview } = await searchParams

  if (!(CATEGORY_SLUGS as readonly string[]).includes(category)) {
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

      <div className="min-h-screen bg-planneo-950 text-planneo-ink">
        <Navbar />
        {isPreview && (
          <div className="bg-[#2F241D] px-4 py-2 pt-20 text-center text-sm font-medium text-white">
            Vista previa admin. Este perfil puede no estar publicado.
          </div>
        )}

        {/* Breadcrumb */}
        <div className={`border-b border-white/10 bg-planneo-900 ${isPreview ? '' : 'pt-16'}`}>
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-white/50" aria-label="Migas de pan">
              <Link href="/" className="transition-colors hover:text-planneo-300">
                Inicio
              </Link>
              <span className="mx-2 text-white/25">/</span>
              <Link href={`/${category}`} className="transition-colors hover:text-planneo-300">
                {provider.categories?.name}
              </Link>
              <span className="mx-2 text-white/25">/</span>
              <span className="font-medium text-white">{provider.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main content */}
            <article className="min-w-0 flex-1 space-y-6">
              {/* Photo gallery */}
              {provider.photos && provider.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-[24px] border border-white/10">
                  <div className="relative col-span-2 h-64 bg-white/[0.04] sm:col-span-1 sm:h-80">
                    <Image
                      src={provider.photos[0]}
                      alt={`${provider.name} foto principal`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {provider.photos.slice(1, 3).map((photo, i) => (
                    <div key={i} className="relative h-32 bg-white/[0.04] sm:h-40">
                      <Image
                        src={photo}
                        alt={`${provider.name} foto ${i + 2}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Profile header */}
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="v4-display text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                      {provider.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/60">
                      {provider.categories && (
                        <span className="rounded-full border border-planneo-300/40 bg-planneo-600/20 px-3 py-1 font-medium text-planneo-300">
                          {provider.categories.name}
                        </span>
                      )}
                      {provider.zona && (
                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {provider.zona}
                        </span>
                      )}
                      {provider.price_range && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          {PRICE_LABEL[provider.price_range] ?? provider.price_range}
                        </span>
                      )}
                      {provider.status === 'claimed' && (
                        <span className="flex items-center gap-1.5 rounded-full border border-planneo-mint/30 bg-planneo-mint/10 px-3 py-1 font-medium text-planneo-mint">
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {provider.description && (
                  <p className="mt-5 whitespace-pre-line leading-7 text-white/70">
                    {provider.description}
                  </p>
                )}
              </div>

              {/* Event types */}
              {provider.event_types && provider.event_types.length > 0 && (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                  <p className="v4-mono text-[10px] text-planneo-300">EVENTOS</p>
                  <h2 className="v4-display mb-4 mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Tipos de evento</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.event_types.map((type) => (
                      <span
                        key={type}
                        className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/80"
                      >
                        {EVENT_LABEL[type] ?? type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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

            {/* Contact sidebar */}
            <aside className="shrink-0 lg:w-80">
              <div className="v4-glass sticky top-24 space-y-4 rounded-[24px] p-6">
                <div>
                  <p className="v4-mono text-[10px] text-planneo-300">COTIZA EN PLANNEO</p>
                  <h2 className="v4-display mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Contactar</h2>
                </div>

                {/* Todo el contacto y la cotización viven dentro de Planneo:
                    no exponemos WhatsApp ni email directo del proveedor. */}
                <QuoteRequestForm providerId={provider.id} />

                <p className="text-xs leading-5 text-white/50">
                  Recibirás la cotización y podrás conversar con el proveedor directamente en Planneo, sin salir de la plataforma.
                </p>

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
      </div>
    </>
  )
}
