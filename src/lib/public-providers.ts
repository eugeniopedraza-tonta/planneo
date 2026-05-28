import type { ProviderWithCategory } from '@/lib/types'
import { createStaticClient } from '@/lib/supabase/server'

export type PublicProviderFilters = {
  q?: string
  category?: string
  zona?: string
  evento?: string
  precio?: string
  limit?: number
}

const PUBLIC_STATUSES = ['published', 'claimed'] as const

export async function getPublicProviders(filters: PublicProviderFilters = {}) {
  const supabase = createStaticClient()
  const limit = Math.min(Math.max(filters.limit ?? 60, 1), 100)
  const q = filters.q?.trim()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .in('status', PUBLIC_STATUSES)
    .order('status', { ascending: true })
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

  if (q) {
    const { data: ftsData, error: ftsError } = await query.textSearch('search_vector', q, {
      type: 'websearch',
      config: 'spanish',
    })

    if (!ftsError && ftsData && ftsData.length > 0) {
      return ftsData as ProviderWithCategory[]
    }

    const safeQ = q.replace(/[%,()\\*"']/g, ' ').trim().slice(0, 64)
    if (!safeQ) return []

    let fallback = supabase
      .from('providers')
      .select('*, categories(id, name, slug)')
      .in('status', PUBLIC_STATUSES)
      .ilike('name', `%${safeQ}%`)
      .order('status', { ascending: true })
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
    return (data ?? []) as ProviderWithCategory[]
  }

  const { data } = await query
  return (data ?? []) as ProviderWithCategory[]
}
