import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider_id } = await request.json()
  if (!provider_id) {
    return NextResponse.json({ error: 'provider_id requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('claim_tokens')
    .insert({
      provider_id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('token')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://planneo.mx'
  const url = `${baseUrl}/reclamar/${data.token}`

  return NextResponse.json({ url })
}
