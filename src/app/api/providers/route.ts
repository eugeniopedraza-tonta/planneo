import { NextRequest, NextResponse } from 'next/server'
import { getPublicProviders } from '@/lib/public-providers'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const providers = await getPublicProviders({
    q: params.get('q') ?? undefined,
    category: params.get('categoria') ?? params.get('category') ?? undefined,
    zona: params.get('zona') ?? undefined,
    evento: params.get('evento') ?? undefined,
    precio: params.get('precio') ?? undefined,
    limit: Number(params.get('limit') ?? 60),
  })

  return NextResponse.json({ providers })
}
