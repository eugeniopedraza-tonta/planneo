import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = 'https://planneo.mx'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: providers } = await supabase
    .from('providers')
    .select('slug, updated_at, categories(slug)')
    .eq('status', 'published')

  const providerUrls = providers?.flatMap(p => {
    const catSlug = (p.categories as any)?.slug
    if (!catSlug) return []
    return [{
      url: `${BASE}/${catSlug}/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }]
  }) ?? []

  const categoryUrls = ['fotografia', 'belleza', 'musica', 'banquete', 'decoracion'].map(slug => ({
    url: `${BASE}/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  return [
    { url: BASE, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/buscar`, changeFrequency: 'daily', priority: 0.5 },
    ...categoryUrls,
    ...providerUrls,
  ]
}
