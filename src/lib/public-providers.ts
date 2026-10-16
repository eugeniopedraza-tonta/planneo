import { cache } from 'react'
import type { ProviderWithCategory, PublicAvailability } from '@/lib/types'
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

/** Tope del listado público (`limit` se recorta a esto). */
export const CATALOG_MAX_LIMIT = 100

/**
 * Máximo de ids por filtro `in` / `not.in`. Cada UUID ocupa ~37 bytes en la URL
 * de PostgREST; 100 ids ≈ 3.7 KB, lejos de los límites de URL del gateway.
 */
export const MAX_IDS_PER_FILTER = 100

/** Tope de filas que PostgREST devuelve por petición (`max-rows` de Supabase). */
const POSTGREST_MAX_ROWS = 1000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PublicAvailabilityRow = Pick<PublicAvailability, 'provider_id' | 'status'>

/** Estado público de un día: quién está ocupado (se oculta) y quién confirmó libre. */
export type DateStatuses = { booked: string[]; available: Set<string> }

/** Puro. `tentative` (o sin fila) ni oculta ni confirma: queda «sin confirmar». */
export function splitDateStatuses(rows: PublicAvailabilityRow[]): DateStatuses {
  const booked: string[] = []
  const available = new Set<string>()
  for (const row of rows) {
    if (row.status === 'booked') booked.push(row.provider_id)
    else if (row.status === 'available') available.add(row.provider_id)
  }
  return { booked, available }
}

/** Puro. Parte `ids` en lotes de a lo más `size`. */
export function chunkIds(ids: string[], size = MAX_IDS_PER_FILTER): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size))
  return chunks
}

/** Puro. Lista `(a,b,c)` para `in` / `not.in` de PostgREST; solo deja pasar UUIDs. */
export function toPostgrestIdList(ids: string[]): string {
  return `(${ids.filter((id) => UUID_RE.test(id)).join(',')})`
}

/**
 * Todas las filas públicas de disponibilidad de un día. Acotado por la fecha:
 * a lo más una fila por proveedor (`unique (provider_id, date)`). Pagina por si
 * algún día rebasa `max-rows`. `null` = falló la consulta (queda en el log).
 * `cache` de React: listado y conteo del mismo render lo consultan una vez.
 */
const getDateStatuses = cache(async (fecha: string): Promise<DateStatuses | null> => {
  const supabase = createStaticClient()
  const rows: PublicAvailabilityRow[] = []
  for (let from = 0; ; from += POSTGREST_MAX_ROWS) {
    const { data, error } = await supabase
      .from('public_provider_availability')
      .select('provider_id, status')
      .eq('date', fecha)
      .order('provider_id')
      .range(from, from + POSTGREST_MAX_ROWS - 1)
      .returns<PublicAvailabilityRow[]>()
    if (error) {
      console.error('[catalogo] disponibilidad por fecha falló', { fecha, error })
      return null
    }
    rows.push(...(data ?? []))
    if (!data || data.length < POSTGREST_MAX_ROWS) break
  }
  return splitDateStatuses(rows)
})

/**
 * Estado del día, o `null` sin fecha. Si la consulta de disponibilidad falla
 * también es `null`: no se oculta a nadie y todos quedan «sin confirmar» (regla
 * amable: la falta de datos nunca castiga). Listado y conteo comparten este
 * respaldo, así que siguen cuadrando.
 */
async function resolveDateStatuses(fecha: string | undefined): Promise<DateStatuses | null> {
  return fecha ? getDateStatuses(fecha) : null
}

export async function getPublicProviders(
  filters: PublicProviderFilters = {}
): Promise<PublicProviderListItem[]> {
  const supabase = createStaticClient()
  const fecha = parseCatalogFecha(filters.fecha)
  const limit = Math.min(Math.max(filters.limit ?? 60, 1), CATALOG_MAX_LIMIT)
  const q = filters.q?.trim()

  const [categoryId, statuses] = await Promise.all([
    resolveCategoryId(supabase, filters.category),
    resolveDateStatuses(fecha),
  ])
  if (categoryId === null) return []

  // Ocupados: hasta MAX_IDS_PER_FILTER se excluyen en la propia consulta
  // (`not.in`). Si son más, se piden `limit + ocupados` filas y se filtran aquí:
  // a lo más esa cantidad de las traídas puede estar ocupada.
  const booked = statuses?.booked ?? []
  const filterInMemory = booked.length > MAX_IDS_PER_FILTER
  const bookedSet = new Set(booked)
  const fetchLimit = filterInMemory ? Math.min(limit + booked.length, POSTGREST_MAX_ROWS) : limit

  const baseQuery = () => {
    const query = applyProviderFilters(
      supabase.from('providers').select('*, categories(id, name, slug)'),
      filters,
      categoryId
    )
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(fetchLimit)
    return booked.length > 0 && !filterInMemory
      ? query.not('id', 'in', toPostgrestIdList(booked))
      : query
  }

  const keep = (rows: unknown[] | null): ProviderWithCategory[] => {
    const list = (rows ?? []) as ProviderWithCategory[]
    return (filterInMemory ? list.filter((row) => !bookedSet.has(row.id)) : list).slice(0, limit)
  }

  let providers: ProviderWithCategory[]

  if (q) {
    const { data: ftsData, error: ftsError } = await baseQuery().textSearch(
      'search_vector',
      q,
      FTS_OPTIONS
    )
    const ftsRows = ftsError ? [] : keep(ftsData)

    if (ftsRows.length > 0) {
      providers = ftsRows
    } else {
      const safeQ = toSafeNameQuery(q)
      if (!safeQ) return []
      const { data, error } = await baseQuery().ilike('name', `%${safeQ}%`)
      if (error) console.error('[catalogo] listado por nombre falló', { error })
      providers = keep(data)
    }
  } else {
    const { data, error } = await baseQuery()
    if (error) console.error('[catalogo] listado falló', { error })
    providers = keep(data)
  }

  if (!fecha) return providers
  return decorateWithDateAvailability(providers, statuses?.available ?? new Set())
}

/**
 * Cuántos proveedores devolvería `getPublicProviders` sin `limit`: mismos
 * filtros, FTS con respaldo por nombre cuando FTS no encuentra nada y, con
 * fecha, sin los ocupados ese día (mismo respaldo si falla la disponibilidad).
 * Es el total real; el listado se corta en `limit`.
 * `null` = no se pudo contar (el error queda en el log del servidor).
 */
export async function countPublicProviders(
  filters: Omit<PublicProviderFilters, 'limit'> = {}
): Promise<number | null> {
  const supabase = createStaticClient()
  const fecha = parseCatalogFecha(filters.fecha)
  const q = filters.q?.trim()

  const [categoryId, statuses] = await Promise.all([
    resolveCategoryId(supabase, filters.category),
    resolveDateStatuses(fecha),
  ])
  if (categoryId === null) return 0

  const booked = statuses?.booked ?? []
  const bookedChunks = booked.length > MAX_IDS_PER_FILTER ? chunkIds(booked) : []

  // Conteo `head`: no viaja ninguna fila.
  const headQuery = () =>
    applyProviderFilters(
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      filters,
      categoryId
    )
  type HeadQuery = ReturnType<typeof headQuery>

  const countOf = async (query: HeadQuery): Promise<number | null> => {
    const { count, error } = await query
    if (error) {
      console.error('[catalogo] conteo falló', { error })
      return null
    }
    return count ?? 0
  }

  // Pocos ocupados: `not.in` en la misma consulta. Muchos: total menos lo que
  // aporta cada lote de ocupados (`in` de ≤100 ids). Los lotes son disjuntos,
  // así que la resta es exacta.
  const netCount = async (search: (query: HeadQuery) => HeadQuery): Promise<number | null> => {
    if (bookedChunks.length === 0) {
      const query = search(headQuery())
      return countOf(booked.length > 0 ? query.not('id', 'in', toPostgrestIdList(booked)) : query)
    }
    const [total, ...bookedCounts] = await Promise.all([
      countOf(search(headQuery())),
      ...bookedChunks.map((ids) => countOf(search(headQuery()).in('id', ids))),
    ])
    if (total === null || bookedCounts.some((n) => n === null)) return null
    return Math.max(total - bookedCounts.reduce<number>((sum, n) => sum + (n ?? 0), 0), 0)
  }

  if (!q) return netCount((query) => query)

  // Igual que el listado: si FTS falla o no encuentra nada, respaldo por nombre.
  const fts = await netCount((query) => query.textSearch('search_vector', q, FTS_OPTIONS))
  if (fts !== null && fts > 0) return fts
  const safeQ = toSafeNameQuery(q)
  if (!safeQ) return 0
  return netCount((query) => query.ilike('name', `%${safeQ}%`))
}

function decorateWithDateAvailability(
  providers: ProviderWithCategory[],
  available: Set<string>
): PublicProviderListItem[] {
  return providers
    .map((provider): PublicProviderListItem => ({
      ...provider,
      dateAvailability: available.has(provider.id) ? 'available' : 'unconfirmed',
    }))
    .sort((a, b) => {
      const rank = (item: PublicProviderListItem) => (item.dateAvailability === 'available' ? 0 : 1)
      const byAvailability = rank(a) - rank(b)
      if (byAvailability !== 0) return byAvailability
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    })
}
