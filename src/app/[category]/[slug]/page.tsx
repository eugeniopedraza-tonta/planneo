import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient, createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600
export const dynamicParams = true
import { CATEGORY_SLUGS } from '@/lib/constants'
import WhatsAppButton from '@/components/whatsapp-button'
import ProfileViewTracker from '@/components/profile-view-tracker'
import Navbar from '@/components/landing/Navbar'
import type { ProviderWithCategory } from '@/lib/types'

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

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {isPreview && (
          <div className="bg-[#2F241D] px-4 py-2 pt-20 text-center text-sm font-medium text-white">
            Vista previa admin. Este perfil puede no estar publicado.
          </div>
        )}

        {/* Breadcrumb */}
        <div className={`bg-white border-b border-gray-100 ${isPreview ? '' : 'pt-16'}`}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
            <nav className="text-sm text-[#6B7280]">
              <Link href="/" className="hover:text-[#7C3AED] transition-colors">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/${category}`} className="hover:text-[#7C3AED] transition-colors">
                {provider.categories?.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#111827] font-medium">{provider.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <article className="flex-1 min-w-0 space-y-6">
              {/* Photo gallery */}
              {provider.photos && provider.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                  <div className="col-span-2 sm:col-span-1 relative h-64 sm:h-80 bg-gray-100">
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
                    <div key={i} className="relative h-32 sm:h-40 bg-gray-100">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                      {provider.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#6B7280]">
                      {provider.categories && (
                        <span className="bg-purple-50 text-[#7C3AED] font-medium px-2.5 py-0.5 rounded-full">
                          {provider.categories.name}
                        </span>
                      )}
                      {provider.zona && (
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">📍</span>
                          {provider.zona}
                        </span>
                      )}
                      {provider.price_range && (
                        <span>{PRICE_LABEL[provider.price_range] ?? provider.price_range}</span>
                      )}
                      {provider.status === 'claimed' && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <span aria-hidden="true">✓</span> Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {provider.description && (
                  <p className="mt-4 text-[#374151] leading-relaxed whitespace-pre-line">
                    {provider.description}
                  </p>
                )}
              </div>

              {/* Event types */}
              {provider.event_types && provider.event_types.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-semibold text-[#111827] mb-3">Tipos de evento</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.event_types.map((type) => (
                      <span
                        key={type}
                        className="bg-purple-50 text-[#7C3AED] text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {EVENT_LABEL[type] ?? type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Contact sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4 space-y-4">
                <h2 className="font-semibold text-[#111827]">Contactar</h2>

                {provider.whatsapp ? (
                  <WhatsAppButton
                    providerId={provider.id}
                    whatsapp={provider.whatsapp}
                    providerName={provider.name}
                  />
                ) : (
                  <p className="text-sm text-[#6B7280]">
                    Este proveedor aún no ha añadido su contacto.
                  </p>
                )}

                {provider.instagram_handle && (
                  <a
                    href={`https://instagram.com/${provider.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#7C3AED] transition-colors"
                  >
                    <span aria-hidden="true">📸</span>
                    @{provider.instagram_handle}
                  </a>
                )}

                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#7C3AED] transition-colors"
                  >
                    <span aria-hidden="true">✉️</span>
                    {provider.email}
                  </a>
                )}

                <p className="text-xs text-[#9CA3AF] pt-2 border-t border-gray-100">
                  Al contactar aceptas nuestros{' '}
                  <Link href="/terminos" className="underline hover:text-[#7C3AED]">
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
