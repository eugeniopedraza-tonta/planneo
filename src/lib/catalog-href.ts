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
