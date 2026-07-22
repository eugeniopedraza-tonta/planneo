import Link from 'next/link'
import ProviderCard from '@/components/provider-card'
import { EVENT_TYPES, PRICE_RANGES, ZONAS_MTY, CATEGORY_SLUGS } from '@/lib/constants'
import { createStaticClient } from '@/lib/supabase/server'
import { getPublicProviders } from '@/lib/public-providers'
import Navbar from '@/components/landing/Navbar'

type CatalogParams = {
  q?: string
  categoria?: string
  category?: string
  zona?: string
  evento?: string
  precio?: string
}

export default async function ProviderCatalog({
  searchParams,
  action = '/proveedores',
  lockedCategory,
  title = 'Proveedores para eventos en Monterrey.',
  description = 'Filtra por categoría, zona, tipo de evento y precio. No necesitas iniciar sesión para pedir cotización.',
}: {
  searchParams: CatalogParams
  action?: string
  lockedCategory?: string
  title?: string
  description?: string
}) {
  const supabase = createStaticClient()
  const categoryFilter = lockedCategory ?? searchParams.categoria ?? searchParams.category
  const [{ data: categories }, providers] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .in('slug', CATEGORY_SLUGS as unknown as string[])
      .order('name'),
    getPublicProviders({
      q: searchParams.q,
      category: categoryFilter,
      zona: searchParams.zona,
      evento: searchParams.evento,
      precio: searchParams.precio,
      limit: 90,
    }),
  ])

  const hasFilters = Boolean(
    searchParams.q ||
      (!lockedCategory && (searchParams.categoria || searchParams.category)) ||
      searchParams.zona ||
      searchParams.evento ||
      searchParams.precio
  )

  return (
    <div className="min-h-screen bg-planneo-950 text-planneo-ink">
      <Navbar />
      <div className="border-b border-white/10 bg-planneo-900 pt-24">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="v4-display max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-white/60">
            {description}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0">
            <form action={action} method="get" className="sticky top-24 space-y-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div>
                <label htmlFor="catalog-q" className="mb-1.5 block text-sm font-medium text-white/75">
                  Buscar
                </label>
                <input
                  id="catalog-q"
                  type="search"
                  name="q"
                  defaultValue={searchParams.q ?? ''}
                  placeholder="Fotografía, DJ, catering..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-planneo-300"
                />
              </div>

              {!lockedCategory && (
                <Select
                  label="Categoría"
                  name="categoria"
                  value={searchParams.categoria ?? searchParams.category ?? ''}
                  options={(categories ?? []).map((c) => ({ value: c.slug, label: c.name }))}
                />
              )}
              <Select label="Zona" name="zona" value={searchParams.zona ?? ''} options={ZONAS_MTY.map((z) => ({ value: z, label: z }))} />
              <Select label="Tipo de evento" name="evento" value={searchParams.evento ?? ''} options={EVENT_TYPES.map((e) => ({ value: e.value, label: e.label }))} />
              <Select label="Precio" name="precio" value={searchParams.precio ?? ''} options={PRICE_RANGES.map((p) => ({ value: p.value, label: p.label }))} />

              <button type="submit" className="min-h-11 w-full rounded-xl bg-planneo-600 font-semibold text-white transition hover:bg-planneo-500">
                Aplicar filtros
              </button>
              {hasFilters && (
                <Link href={action} className="block text-center text-sm font-medium text-white/55 transition hover:text-white">
                  Limpiar filtros
                </Link>
              )}
            </form>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-white/55">{providers.length} proveedor{providers.length === 1 ? '' : 'es'} encontrado{providers.length === 1 ? '' : 's'}</p>
                {searchParams.q && (
                  <p className="mt-1 text-sm text-white/50">Resultados para &ldquo;{searchParams.q}&rdquo;</p>
                )}
              </div>
            </div>

            {providers.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
                <h2 className="v4-display text-3xl font-bold tracking-[-0.04em]">Sin resultados</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
                  No encontramos proveedores con esa combinación. Prueba quitando un filtro o buscando una categoría más general.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

function Select({
  label,
  name,
  value,
  options,
}: {
  label: string
  name: string
  value: string
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={`catalog-${name}`} className="mb-1.5 block text-sm font-medium text-white/75">
        {label}
      </label>
      <select
        id={`catalog-${name}`}
        name={name}
        defaultValue={value}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#211A30] px-3 text-sm text-white outline-none focus:border-planneo-300"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
