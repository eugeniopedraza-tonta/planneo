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
import {
  catalogAllPath,
  catalogClearPath,
  countCatalogFilters,
  withCatalogQuery,
  type CatalogQuery,
} from '@/lib/catalog-href'
import { createStaticClient } from '@/lib/supabase/server'
import {
  formatCatalogFecha,
  getPublicProviders,
  parseCatalogFecha,
} from '@/lib/public-providers'
import Navbar from '@/components/landing/Navbar'
import CatalogFilters from '@/components/catalog/catalog-filters'
import CatalogEmptyState from '@/components/catalog/catalog-empty-state'
import SubcategoryChips from '@/components/catalog/subcategory-chips'
import CategoryEditorial from '@/components/category-editorial'
import { getCategoryContent } from '../../content/categories'

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
  action = '/catalogo',
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
  const query: CatalogQuery = {
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
  // Filtros = q, zona, evento, precio, fecha y sub. La categoría no cuenta (ver CATALOG_FILTER_KEYS).
  const appliedQuery = query
  const activeFilters = countCatalogFilters(appliedQuery)
  const formAction = selectedSlug ? `/${selectedSlug}` : action
  const clearHref = catalogClearPath(action, selectedSlug)
  const isEmpty = providers.length === 0
  // Guía + FAQs solo en la página canónica `/{categoria}` (no en `/buscar?categoria=`).
  const editorial =
    lockedCategory && isCategorySlug(lockedCategory) ? getCategoryContent(lockedCategory) : null

  const subcategoryChips = selectedSlug
    ? [
        {
          label: 'Todas',
          href: withCatalogQuery(`/${selectedSlug}`, query),
          selected: !searchParams.sub,
        },
        ...subcategoryOptions.map((label) => ({
          label,
          href: withCatalogQuery(`/${selectedSlug}`, { ...query, sub: label }, true),
          selected: searchParams.sub === label,
        })),
      ]
    : []

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
        <SubcategoryChips chips={subcategoryChips} />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:gap-8 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0">
            <CatalogFilters
              key={withCatalogQuery(formAction, appliedQuery, true)}
              action={formAction}
              categorySlug={categoryFilter}
              applied={appliedQuery}
              appliedCount={providers.length}
              clearHref={clearHref}
              zonas={ZONAS_MTY.map((z) => ({ value: z, label: z }))}
              eventos={EVENT_TYPES.map((e) => ({ value: e.value, label: e.label }))}
              precios={PRICE_RANGES.map((p) => ({ value: p.value, label: p.label }))}
            />
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

            {isEmpty ? (
              activeFilters > 0 ? (
                <CatalogEmptyState
                  kind="filtered"
                  clearHref={clearHref}
                  allHref={allPath}
                  fechaLabel={fecha ? formatCatalogFecha(fecha) : undefined}
                />
              ) : (
                <CatalogEmptyState kind="unfiltered" categoryName={selectedName ?? undefined} />
              )
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

            {editorial && (
              <div className={isEmpty ? 'mt-10' : 'mt-14 border-t border-white/10 pt-10'}>
                <CategoryEditorial content={editorial} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
