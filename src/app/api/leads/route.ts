import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LeadSchema = z.object({
  provider_id: z.string().uuid(),
  type: z.enum(['whatsapp_click', 'profile_view']),
  session_id: z.string().max(128).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const parsed = LeadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { provider_id, type, session_id } = parsed.data
  const supabase = await createClient()
  const referrer = request.headers.get('referer') ?? null

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('id', provider_id)
    .in('status', ['published', 'claimed'])
    .maybeSingle()

  if (!provider) {
    return NextResponse.json({ error: 'Proveedor no publicado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('leads')
    .insert({ provider_id, type, session_id: session_id ?? null, referrer })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
