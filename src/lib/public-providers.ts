import type { AvailabilityStatus, ProviderWithCategory, PublicAvailability } from '@/lib/types'
import { createStaticClient } from '@/lib/supabase/server'

export type PublicProviderFilters = {
  q?: string
  category?: string
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

export async function getPublicProviders(
  filters: PublicProviderFilters = {}
): Promise<PublicProviderListItem[]> {
  const supabase = createStaticClient()
  const fecha = parseCatalogFecha(filters.fecha)
  const limit = Math.min(Math.max(filters.limit ?? 60, 1), 100)
  const q = filters.q?.trim()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('status', 'published')
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .maybeSingle()

    if (!category) return []
    query = query.eq('category_id', category.id)
  }

  if (filters.zona) query = query.eq('zona', filters.zona)
  if (filters.evento) query = query.contains('event_types', [filters.evento])
  if (filters.precio) query = query.eq('price_range', filters.precio)

  let providers: ProviderWithCategory[]

  if (q) {
    const { data: ftsData, error: ftsError } = await query.textSearch('search_vector', q, {
      type: 'websearch',
      config: 'spanish',
    })

    if (!ftsError && ftsData && ftsData.length > 0) {
      providers = ftsData as ProviderWithCategory[]
    } else {
      const safeQ = q.replace(/[%,()\\*"']/g, ' ').trim().slice(0, 64)
      if (!safeQ) return []

      let fallback = supabase
        .from('providers')
        .select('*, categories(id, name, slug)')
        .eq('status', 'published')
        .ilike('name', `%${safeQ}%`)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters.category) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .maybeSingle()

        if (!category) return []
        fallback = fallback.eq('category_id', category.id)
      }
      if (filters.zona) fallback = fallback.eq('zona', filters.zona)
      if (filters.evento) fallback = fallback.contains('event_types', [filters.evento])
      if (filters.precio) fallback = fallback.eq('price_range', filters.precio)

      const { data } = await fallback
      providers = (data ?? []) as ProviderWithCategory[]
    }
  } else {
    const { data } = await query
    providers = (data ?? []) as ProviderWithCategory[]
  }

  if (!fecha) return providers
  return applyFechaAvailability(supabase, providers, fecha)
}

type PublicAvailabilityRow = Pick<PublicAvailability, 'provider_id' | 'status'>

async function applyFechaAvailability(
  supabase: ReturnType<typeof createStaticClient>,
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
