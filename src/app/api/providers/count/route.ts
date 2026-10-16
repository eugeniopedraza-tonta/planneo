import { NextRequest, NextResponse } from 'next/server'
import { countPublicProviders } from '@/lib/public-providers'

/**
 * Conteo para el botón "Ver resultados (N)" de los filtros del catálogo.
 * Mismos parámetros que la URL del catálogo y misma lógica que el listado
 * (`countPublicProviders` comparte los filtros con `getPublicProviders`).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const param = (key: string) => params.get(key)?.trim().slice(0, 120) || undefined

  const count = await countPublicProviders({
    q: param('q'),
    category: param('categoria') ?? param('category'),
    subcategory: param('sub'),
    zona: param('zona'),
    evento: param('evento'),
    precio: param('precio'),
    fecha: param('fecha'),
  })

  // Si no se pudo contar, 503 sin caché: el botón muestra "…" en vez de un número falso.
  if (count === null) {
    return NextResponse.json({ count: null }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json(
    { count },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}
