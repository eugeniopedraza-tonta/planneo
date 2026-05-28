import { NextRequest, NextResponse } from 'next/server'
import { createClient, createStaticClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params
  const preview = request.nextUrl.searchParams.get('preview') === 'true'
  const supabase = preview ? await createClient() : createStaticClient()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('id', id)

  if (!preview) {
    query = query.in('status', ['published', 'claimed'])
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ provider: data })
}
