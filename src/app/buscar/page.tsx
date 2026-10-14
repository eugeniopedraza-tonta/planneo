import type { Metadata } from 'next'
import ProviderCatalog from '@/components/provider-catalog'
import PageEvent from '@/components/analytics/page-event'
import { pageMetadata } from '@/lib/seo'

type PageProps = {
  searchParams: Promise<{
    q?: string
    categoria?: string
    zona?: string
    evento?: string
    precio?: string
    fecha?: string
  }>
}

export const metadata: Metadata = pageMetadata({
  title: 'Buscar proveedores de eventos en Monterrey',
  description:
    'Busca fotógrafos, música, decoración, belleza y banquetes para tu boda o evento en Monterrey y el área metropolitana.',
  path: '/buscar',
})

export default async function BuscarPage({ searchParams }: PageProps) {
  return (
    <>
      <PageEvent name="search_view" />
      <ProviderCatalog
        searchParams={await searchParams}
        action="/buscar"
        title="Busca proveedores para tu evento."
        description="Escribe lo que necesitas o entra directo por categoría."
      />
    </>
  )
}
