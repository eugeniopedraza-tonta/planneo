import Link from 'next/link'
import ProviderCard from '@/components/provider-card'
import CatalogCategoryRail from '@/components/catalog-category-rail'
import {
  EVENT_TYPES,
  PRICE_RANGES,
  ZONAS_MTY,
  CATEGORY_SLUGS,
  CATEGORY_NAMES,
  CATEGORY_SHORT_NAMES,
  getSubcategories,
  sortByCategoryTree,
  isCategorySlug,
} from '@/lib/constants'
import { catalogAllPath, withCatalogQuery } from '@/lib/catalog-href'
import { createStaticClient } from '@/lib/supabase/server'
import {
  formatCatalogFecha,
  getPublicProviders,
  parseCatalogFecha,
} from '@/lib/public-providers'
import Navbar from '@/components/landing/Navbar'

type CatalogParams = {
  q?: string
  categoria?: string
  category?: string
  zona?: string
  evento?: string
  precio?: string
  sub?: string
  fecha?: string
}

export default async function ProviderCatalog({
  searchParams,
  action = '/proveedores',
  lockedCategory,
  title = 'Tu evento empieza aqui',
  description,
}: {
  searchParams: CatalogParams
  action?: string
  lockedCategory?: string
  title?: string
  description?: string
}) {
  const supabase = createStaticClient()
  const categoryFilter = lockedCategory ?? searchParams.categoria ?? searchParams.category
  const subcategoryOptions = categoryFilter ? getSubcategories(categoryFilter) : []
  const fecha = parseCatalogFecha(searchParams.fecha)
  const query = {
    q: searchParams.q,
    zona: searchParams.zona,
    evento: searchParams.evento,
    precio: searchParams.precio,
    fecha,
    sub: searchParams.sub,
  }
  const allPath = catalogAllPath(action)
  const [{ data: categories }, providers] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .in('slug', CATEGORY_SLUGS as unknown as string[]),
    getPublicProviders({
      q: searchParams.q,
      category: categoryFilter,
      subcategory: searchParams.sub,
      zona: searchParams.zona,
      evento: searchParams.evento,
      precio: searchParams.precio,
      fecha,
      limit: 90,
    }),
  ])
  const sortedCategories = sortByCategoryTree(categories ?? [])
  const selectedSlug =
    categoryFilter && isCategorySlug(categoryFilter) ? categoryFilter : undefined
  const selectedName = selectedSlug ? CATEGORY_NAMES[selectedSlug] : null

  const railItems = [
    {
      slug: 'todos',
      shortName: 'Todos',
      href: withCatalogQuery(allPath, query),
      selected: !selectedSlug,
    },
    ...sortedCategories.map((category) => ({
      slug: category.slug,
      shortName: isCategorySlug(category.slug)
        ? CATEGORY_SHORT_NAMES[category.slug]
        : category.name,
      href: withCatalogQuery(`/${category.slug}`, query),
      selected: selectedSlug === category.slug,
    })),
  ]

  const hasFilters = Boolean(
    searchParams.q ||
      searchParams.sub ||
      searchParams.zona ||
      searchParams.evento ||
      searchParams.precio ||
      fecha
  )

  const formAction = selectedSlug ? `/${selectedSlug}` : action

  return (
    <div className="min-h-screen bg-planneo-950 text-planneo-ink">
      <Navbar />
      <a
        href="#catalogo-resultados"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-24 focus:z-50 focus:rounded-lg focus:bg-planneo-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar al listado
      </a>

      <header className="border-b border-white/10 bg-planneo-900 pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <p className="v4-mono text-[11px] text-planneo-300">
            {selectedName ? selectedName.toUpperCase() : 'CATÁLOGO'}
          </p>
          <h1 className="v4-display mt-3 max-w-4xl text-3xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
          )}
          <div className="mt-8 pb-5">
            <CatalogCategoryRail items={railItems} />
          </div>
        </div>
      </header>

      {selectedSlug && subcategoryOptions.length > 0 && (
        <div className="border-b border-white/10 bg-planneo-950/80">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-6 lg:px-12 [&::-webkit-scrollbar]:hidden">
            <Link
              href={withCatalogQuery(`/${selectedSlug}`, query)}
              aria-current={!searchParams.sub ? 'page' : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 ${
                !searchParams.sub
                  ? 'bg-white text-planneo-950'
                  : 'border border-white/10 text-white/70 hover:border-white/25 hover:text-white'
              }`}
            >
              Todas
            </Link>
            {subcategoryOptions.map((label) => {
              const selected = searchParams.sub === label
              return (
                <Link
                  key={label}
                  href={withCatalogQuery(`/${selectedSlug}`, { ...query, sub: label }, true)}
                  aria-current={selected ? 'page' : undefined}
                  className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 ${
                    selected
                      ? 'bg-white text-planneo-950'
                      : 'border border-white/10 text-white/70 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0">
            <form
              action={formAction}
              method="get"
              className="sticky top-24 space-y-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="text-sm font-semibold text-white">Afinar búsqueda</p>
              {searchParams.sub && <input type="hidden" name="sub" value={searchParams.sub} />}
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
              <Select label="Zona" name="zona" value={searchParams.zona ?? ''} options={ZONAS_MTY.map((z) => ({ value: z, label: z }))} />
              <Select label="Tipo de evento" name="evento" value={searchParams.evento ?? ''} options={EVENT_TYPES.map((e) => ({ value: e.value, label: e.label }))} />
              <Select label="Precio" name="precio" value={searchParams.precio ?? ''} options={PRICE_RANGES.map((p) => ({ value: p.value, label: p.label }))} />

              <div>
                <label htmlFor="catalog-fecha" className="mb-1.5 block text-sm font-medium text-white/75">
                  Fecha
                </label>
                <input
                  id="catalog-fecha"
                  type="date"
                  name="fecha"
                  defaultValue={fecha ?? ''}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-planneo-300"
                />
              </div>

              <button type="submit" className="min-h-11 w-full rounded-xl bg-planneo-600 font-semibold text-white transition hover:bg-planneo-500">
                Aplicar filtros
              </button>
              {hasFilters && (
                <Link
                  href={selectedSlug ? `/${selectedSlug}` : allPath}
                  className="block text-center text-sm font-medium text-white/55 transition hover:text-white"
                >
                  Limpiar filtros
                </Link>
              )}
            </form>
          </aside>

          <main id="catalogo-resultados" className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-white/55">
                  {providers.length} proveedor{providers.length === 1 ? '' : 'es'} encontrado{providers.length === 1 ? '' : 's'}
                </p>
                {searchParams.q && (
                  <p className="mt-1 text-sm text-white/50">Resultados para &ldquo;{searchParams.q}&rdquo;</p>
                )}
                {fecha && (
                  <p className="mt-1 text-sm text-white/50">
                    Disponibilidad para el {formatCatalogFecha(fecha)}
                  </p>
                )}
              </div>
            </div>

            {providers.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
                <h2 className="v4-display text-3xl font-bold tracking-[-0.04em]">Sin resultados</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
                  {fecha
                    ? `Nadie aparece como disponible o por confirmar el ${formatCatalogFecha(fecha)}. Quienes ya tienen ese día ocupado no se muestran. Prueba otra fecha o quita el filtro de fecha.`
                    : 'No encontramos proveedores con esa combinación. Prueba quitando un filtro o eligiendo otra categoría.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    dateAvailability={fecha ? provider.dateAvailability : undefined}
                  />
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
