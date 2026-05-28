import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS } from '@/lib/constants'
import ProviderCatalog from '@/components/provider-catalog'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{
    q?: string
    zona?: string
    evento?: string
    precio?: string
  }>
}

async function getCategoryBySlug(slug: string) {

  const supabase = createStaticClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  const title = `${category.name} para eventos en Monterrey — Planneo`
  const description = `Encuentra los mejores proveedores de ${category.name.toLowerCase()} para bodas, XV años y eventos en Monterrey y área metropolitana.`

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description, locale: 'es_MX', type: 'website' },
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params
  const filters = await searchParams

  // Validate slug against known categories
  if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    notFound()
  }

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  return (
    <ProviderCatalog
      searchParams={filters}
      action={`/${slug}`}
      lockedCategory={slug}
      eyebrow={`// ${category.name.toUpperCase()}`}
      title={`${category.name} para eventos en Monterrey.`}
      description={`Encuentra proveedores de ${category.name.toLowerCase()} para bodas, XV años, graduaciones y eventos corporativos.`}
    />
  )
}
