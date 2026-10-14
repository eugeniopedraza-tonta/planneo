export type CatalogQuery = {
  q?: string
  zona?: string
  evento?: string
  precio?: string
  fecha?: string
  sub?: string
}

export function catalogAllPath(action: string) {
  return action === '/buscar' ? '/buscar' : '/proveedores'
}

export function withCatalogQuery(
  path: string,
  query: CatalogQuery,
  keepSub = false
) {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.zona) params.set('zona', query.zona)
  if (query.evento) params.set('evento', query.evento)
  if (query.precio) params.set('precio', query.precio)
  if (query.fecha) params.set('fecha', query.fecha)
  if (keepSub && query.sub) params.set('sub', query.sub)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Parámetros que cuentan como "filtro" en el catálogo. La categoría NO es
 * filtro: en `/{categoria}` va en la ruta y en `/buscar?categoria=` es la
 * sección elegida en el riel. Con cero resultados, sin filtros = la categoría
 * aún no tiene proveedores (estado A); con filtros = la combinación no da
 * (estado B).
 */
export const CATALOG_FILTER_KEYS = ['q', 'zona', 'evento', 'precio', 'fecha', 'sub'] as const

export function countCatalogFilters(query: CatalogQuery): number {
  return CATALOG_FILTER_KEYS.filter((key) => Boolean(query[key]?.trim())).length
}

/** Misma ruta sin filtros: `/{categoria}` en categorías, raíz en el catálogo. */
export function catalogClearPath(action: string, categorySlug?: string) {
  return categorySlug ? `/${categorySlug}` : catalogAllPath(action)
}
