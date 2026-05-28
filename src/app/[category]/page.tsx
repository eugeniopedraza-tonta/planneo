import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, ZONAS_MTY, EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'

export const revalidate = 3600
import ProviderCard from '@/components/provider-card'
import type { ProviderWithCategory } from '@/lib/types'

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{
    zona?: string
    evento?: string
    precio?: string
  }>
}

async function getCategoryBySlug(slug: string) {

  const supabase = createStaticClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()
  return data
}

async function getProviders(
  categoryId: string,
  filters: { zona?: string; evento?: string; precio?: string }
) {

  const supabase = createStaticClient()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('status', { ascending: false }) // claimed first

  if (filters.zona) {
    query = query.eq('zona', filters.zona)
  }
  if (filters.evento) {
    query = query.contains('event_types', [filters.evento])
  }
  if (filters.precio) {
    query = query.eq('price_range', filters.precio)
  }

  const { data } = await query.limit(60)
  return (data ?? []) as ProviderWithCategory[]
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  const title = `${category.name} para eventos en Monterrey — Planneo`
  const description = `Encuentra los mejores proveedores de ${category.name.toLowerCase()} para bodas, XV años y eventos en Monterrey y área metropolitana.`

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description, locale: 'es_MX', type: 'website' },
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params
  const filters = await searchParams

  // Validate slug against known categories
  if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    notFound()
  }

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const providers = await getProviders(category.id, filters)

  const hasFilters = !!(filters.zona || filters.evento || filters.precio)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#7C3AED] transition-colors">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#111827] font-medium">{category.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#111827]">
            {category.name} en Monterrey
          </h1>
          <p className="text-[#6B7280] mt-2">
            {providers.length} proveedores disponibles
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
              <h2 className="font-semibold text-[#111827] mb-4">Filtros</h2>

              <form method="get" className="space-y-5">
                {/* Zona */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Zona
                  </label>
                  <select
                    name="zona"
                    defaultValue={filters.zona ?? ''}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                  >
                    <option value="">Todas las zonas</option>
                    {ZONAS_MTY.map((zona) => (
                      <option key={zona} value={zona}>
                        {zona}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evento */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Tipo de evento
                  </label>
                  <select
                    name="evento"
                    defaultValue={filters.evento ?? ''}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                  >
                    <option value="">Todos los eventos</option>
                    {EVENT_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Precio
                  </label>
                  <select
                    name="precio"
                    defaultValue={filters.precio ?? ''}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                  >
                    <option value="">Cualquier precio</option>
                    {PRICE_RANGES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-2.5 transition-colors"
                >
                  Aplicar filtros
                </button>

                {hasFilters && (
                  <Link
                    href={`/${slug}`}
                    className="block text-center text-sm text-[#6B7280] hover:text-[#7C3AED] transition-colors"
                  >
                    Limpiar filtros
                  </Link>
                )}
              </form>
            </div>
          </aside>

          {/* Results grid */}
          <main className="flex-1 min-w-0">
            {providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="text-5xl mb-4">🔍</span>
                <h3 className="text-xl font-semibold text-[#111827] mb-2">
                  Sin resultados
                </h3>
                <p className="text-[#6B7280] mb-6">
                  No encontramos proveedores con esos filtros. Intenta con otra combinación.
                </p>
                <Link
                  href={`/${slug}`}
                  className="text-[#7C3AED] font-medium hover:underline"
                >
                  Ver todos los proveedores
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
