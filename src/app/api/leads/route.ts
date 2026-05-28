import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { provider_id, type, session_id } = await request.json()

  if (!provider_id || !type) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const supabase = await createClient()
  const referrer = request.headers.get('referer') ?? null

  await supabase.from('leads').insert({ provider_id, type, session_id: session_id ?? null, referrer })

  return NextResponse.json({ ok: true })
}
