import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, isCategorySlug } from '@/lib/constants'
import ProviderCatalog from '@/components/provider-catalog'
import PageEvent from '@/components/analytics/page-event'
import JsonLd from '@/components/json-ld'
import { breadcrumbJsonLd } from '@/lib/json-ld'
import { pageMetadata } from '@/lib/seo'

export const revalidate = 3600

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }))
}

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{
    q?: string
    zona?: string
    evento?: string
    precio?: string
    sub?: string
    fecha?: string
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

  // Sin portada de categoría en la base todavía: usa la imagen de marca.
  return pageMetadata({
    title: `${category.name} para eventos en Monterrey`,
    description: `Encuentra los mejores proveedores de ${category.name.toLowerCase()} para bodas, XV años y eventos en Monterrey y área metropolitana.`,
    path: `/${slug}`,
  })
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params
  const filters = await searchParams

  if (!isCategorySlug(slug)) {
    notFound()
  }

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  return (
    <>
    <PageEvent name="category_view" params={{ category_slug: slug }} />
    <JsonLd
      data={breadcrumbJsonLd([
        { name: 'Inicio', path: '/' },
        { name: category.name, path: `/${slug}` },
      ])}
    />
    <ProviderCatalog
      searchParams={filters}
      action={`/${slug}`}
      lockedCategory={slug}
      title={`${category.name} para eventos en Monterrey.`}
      description={`Encuentra proveedores de ${category.name.toLowerCase()} para bodas, XV años, graduaciones y eventos corporativos.`}
    />
    </>
  )
}
