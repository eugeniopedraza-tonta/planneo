import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS } from '@/lib/constants'

const BASE = 'https://planneo.mx'

type ProviderSitemapRow = {
  slug: string
  updated_at: string
  categories: { slug: string } | { slug: string }[] | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: providers } = await supabase
    .from('providers')
    .select('slug, updated_at, categories(slug)')
    .in('status', ['published', 'claimed'])

  const providerUrls = (providers as ProviderSitemapRow[] | null)?.flatMap(p => {
    const category = Array.isArray(p.categories) ? p.categories[0] : p.categories
    const catSlug = category?.slug
    if (!catSlug) return []
    return [{
      url: `${BASE}/${catSlug}/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }]
  }) ?? []

  const categoryUrls = CATEGORY_SLUGS.map(slug => ({
    url: `${BASE}/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  return [
    { url: BASE, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/proveedores`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/buscar`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${BASE}/terminos`, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE}/privacidad`, changeFrequency: 'monthly', priority: 0.2 },
    ...categoryUrls,
    ...providerUrls,
  ]
}
