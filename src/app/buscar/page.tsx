import type { Metadata } from 'next'
import ProviderCatalog from '@/components/provider-catalog'

type PageProps = {
  searchParams: Promise<{
    q?: string
    categoria?: string
    zona?: string
    evento?: string
    precio?: string
  }>
}

export const metadata: Metadata = {
  title: 'Buscar proveedores de eventos en Monterrey — Planneo',
  description:
    'Busca fotógrafos, música, decoración, belleza y banquetes para tu boda o evento en Monterrey y el área metropolitana.',
  alternates: { canonical: '/buscar' },
}

export default async function BuscarPage({ searchParams }: PageProps) {
  return <ProviderCatalog searchParams={await searchParams} action="/buscar" />
}
