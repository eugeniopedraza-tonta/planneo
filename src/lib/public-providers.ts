import type { AvailabilityStatus, ProviderWithCategory, PublicAvailability } from '@/lib/types'
import { createStaticClient } from '@/lib/supabase/server'

export type PublicProviderFilters = {
  q?: string
  category?: string
  subcategory?: string
  zona?: string
  evento?: string
  precio?: string
  /** Optional catalog date (`YYYY-MM-DD`). Invalid values are ignored. */
  fecha?: string
  limit?: number
}

/** Badge on listing cards when a date filter is active. Booked rows are hidden. */
export type CatalogDateAvailability = 'available' | 'unconfirmed'

export type PublicProviderListItem = ProviderWithCategory & {
  dateAvailability?: CatalogDateAvailability
}

const CATALOG_FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Accepts only a real calendar day in `YYYY-MM-DD`. Anything else is no filter. */
export function parseCatalogFecha(value?: string | null): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  const match = CATALOG_FECHA_RE.exec(raw)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined
  }
  return raw
}

export function formatCatalogFecha(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

type StaticClient = ReturnType<typeof createStaticClient>

/**
 * `undefined` = sin filtro de categoría; `null` = el slug no existe (cero
 * resultados). Se resuelve una vez y lo comparten listado y conteo.
 */
async function resolveCategoryId(
  supabase: StaticClient,
  slug?: string
): Promise<string | null | undefined> {
  if (!slug) return undefined
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Lo único que usamos de un query builder de PostgREST. Los genéricos de
 * supabase-js son demasiado profundos para expresarlo como restricción de `T`
 * (TS2589), así que se estrecha por dentro y se devuelve el mismo builder.
 */
interface ProviderFilterable {
  eq(column: string, value: unknown): ProviderFilterable
  contains(column: string, value: string[]): ProviderFilterable
}

/**
 * Filtros estructurados que comparten listado y conteo. Es la garantía de que
 * "Ver resultados (N)" y la lista nunca discrepen: si cambias algo, cámbialo aquí.
 */
function applyProviderFilters<T extends { eq: unknown; contains: unknown }>(
  query: T,
  filters: PublicProviderFilters,
  categoryId: string | undefined
): T {
  let next = (query as unknown as ProviderFilterable).eq('status', 'published')
  if (categoryId) next = next.eq('category_id', categoryId)
  if (filters.subcategory) next = next.eq('subcategory', filters.subcategory)
  if (filters.zona) next = next.eq('zona', filters.zona)
  if (filters.evento) next = next.contains('event_types', [filters.evento])
  if (filters.precio) next = next.eq('price_range', filters.precio)
  return next as unknown as T
}

/** Texto seguro para el respaldo por nombre (`ilike`). Vacío = sin resultados. */
function toSafeNameQuery(q: string): string {
  return q.replace(/[%,()\\*"']/g, ' ').trim().slice(0, 64)
}

const FTS_OPTIONS = { type: 'websearch', config: 'spanish' } as const

export async function getPublicProviders(
  filters: PublicProviderFilters = {}
): Promise<PublicProviderListItem[]> {
  const supabase = createStaticClient()
  const fecha = parseCatalogFecha(filters.fecha)
  const limit = Math.min(Math.max(filters.limit ?? 60, 1), 100)
  const q = filters.q?.trim()

  const categoryId = await resolveCategoryId(supabase, filters.category)
  if (categoryId === null) return []

  const baseQuery = () =>
    applyProviderFilters(
      supabase.from('providers').select('*, categories(id, name, slug)'),
      filters,
      categoryId
    )
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

  let providers: ProviderWithCategory[]

  if (q) {
    const { data: ftsData, error: ftsError } = await baseQuery().textSearch(
      'search_vector',
      q,
      FTS_OPTIONS
    )

    if (!ftsError && ftsData && ftsData.length > 0) {
      providers = ftsData as ProviderWithCategory[]
    } else {
      const safeQ = toSafeNameQuery(q)
      if (!safeQ) return []
      const { data } = await baseQuery().ilike('name', `%${safeQ}%`)
      providers = (data ?? []) as ProviderWithCategory[]
    }
  } else {
    const { data } = await baseQuery()
    providers = (data ?? []) as ProviderWithCategory[]
  }

  if (!fecha) return providers
  return applyFechaAvailability(supabase, providers, fecha)
}

/**
 * Cuántos proveedores devolvería `getPublicProviders` con estos filtros, sin
 * traer filas: mismos filtros, FTS con respaldo por nombre cuando FTS no
 * encuentra nada y, con fecha, se descuentan los ocupados ese día.
 * No aplica `limit`: es el total real (el listado se corta en 90).
 */
export async function countPublicProviders(
  filters: Omit<PublicProviderFilters, 'limit'> = {}
): Promise<number> {
  const supabase = createStaticClient()
  const fecha = parseCatalogFecha(filters.fecha)
  const q = filters.q?.trim()

  const categoryId = await resolveCategoryId(supabase, filters.category)
  if (categoryId === null) return 0

  // Con fecha hacen falta los ids para restar ocupados; sin fecha basta un
  // conteo `head` (no viaja ninguna fila).
  const baseQuery = () =>
    applyProviderFilters(
      fecha
        ? supabase.from('providers').select('id')
        : supabase.from('providers').select('id', { count: 'exact', head: true }),
      filters,
      categoryId
    ).limit(1000)

  type Counted = { ids: string[]; total: number; failed: boolean }
  const run = async (query: ReturnType<typeof baseQuery>): Promise<Counted> => {
    const { data, count, error } = await query
    const ids = ((data ?? []) as { id: string }[]).map((row) => row.id)
    return { ids, total: fecha ? ids.length : (count ?? 0), failed: Boolean(error) }
  }

  let result: Counted
  if (q) {
    result = await run(baseQuery().textSearch('search_vector', q, FTS_OPTIONS))
    if (result.failed || result.total === 0) {
      const safeQ = toSafeNameQuery(q)
      if (!safeQ) return 0
      result = await run(baseQuery().ilike('name', `%${safeQ}%`))
    }
  } else {
    result = await run(baseQuery())
  }

  if (!fecha || result.ids.length === 0) return result.total

  const { count: booked } = await supabase
    .from('public_provider_availability')
    .select('provider_id', { count: 'exact', head: true })
    .eq('date', fecha)
    .eq('status', 'booked')
    .in('provider_id', result.ids)

  return Math.max(result.ids.length - (booked ?? 0), 0)
}

type PublicAvailabilityRow = Pick<PublicAvailability, 'provider_id' | 'status'>

async function applyFechaAvailability(
  supabase: StaticClient,
  providers: ProviderWithCategory[],
  fecha: string
): Promise<PublicProviderListItem[]> {
  if (providers.length === 0) return []

  const { data } = await supabase
    .from('public_provider_availability')
    .select('provider_id, status')
    .eq('date', fecha)
    .in(
      'provider_id',
      providers.map((provider) => provider.id)
    )
    .returns<PublicAvailabilityRow[]>()

  const statusById = new Map<string, AvailabilityStatus>(
    (data ?? []).map((row) => [row.provider_id, row.status])
  )

  return providers
    .filter((provider) => statusById.get(provider.id) !== 'booked')
    .map((provider): PublicProviderListItem => ({
      ...provider,
      dateAvailability:
        statusById.get(provider.id) === 'available' ? 'available' : 'unconfirmed',
    }))
    .sort((a, b) => {
      const rank = (item: PublicProviderListItem) => (item.dateAvailability === 'available' ? 0 : 1)
      const byAvailability = rank(a) - rank(b)
      if (byAvailability !== 0) return byAvailability
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    })
}
