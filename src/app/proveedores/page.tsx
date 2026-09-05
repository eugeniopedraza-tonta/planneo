import type { Metadata } from 'next'
import ProviderCatalog from '@/components/provider-catalog'

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

export const metadata: Metadata = {
  title: 'Catálogo de proveedores para eventos en Monterrey — Planneo',
  description:
    'Explora proveedores publicados y verificados para bodas, XV años, corporativos y graduaciones en Monterrey.',
  alternates: { canonical: '/proveedores' },
}

export default async function ProveedoresPage({ searchParams }: PageProps) {
  return (
    <ProviderCatalog
      searchParams={await searchParams}
      title="Todos los proveedores en Monterrey."
      description="Elige el servicio que necesitas. Luego puedes afinar por zona, fecha o presupuesto."
    />
  )
}
