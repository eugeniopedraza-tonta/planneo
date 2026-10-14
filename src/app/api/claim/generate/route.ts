import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site-url'

/** Vigencia del enlace de reclamación (spec: 7 días, configurable). */
const CLAIM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

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

  // Generar un enlace nuevo invalida los anteriores: si no, un enlace viejo
  // reenviado por error seguiría sirviendo para reclamar el mismo negocio.
  await supabase
    .from('claim_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('provider_id', provider_id)
    .is('used_at', null)
    .is('revoked_at', null)

  const { data, error } = await supabase
    .from('claim_tokens')
    .insert({
      provider_id,
      created_by: user.id,
      expires_at: new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString(),
    })
    .select('token')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = SITE_URL
  const url = `${baseUrl}/reclamar/${data.token}`

  return NextResponse.json({ url })
}
