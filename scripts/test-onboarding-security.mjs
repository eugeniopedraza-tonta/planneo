/**
 * Pruebas adversariales del onboarding contra Supabase local, vía PostgREST
 * (el mismo camino que usaría un atacante con la anon key, que es pública).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY

const service = createClient(URL, SERVICE)
let pass = 0
let fail = 0

function check(name, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  ok   ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

async function signIn(email) {
  const c = createClient(URL, ANON)
  const { error } = await c.auth.signInWithPassword({ email, password: 'test-password-123' })
  if (error) throw new Error(`login ${email}: ${error.message}`)
  return c
}

const { data: provA } = await service
  .from('providers').select('id, slug, status').eq('slug', 'foto-prueba-a').maybeSingle()
const { data: provB } = await service
  .from('providers').select('id, slug, status').eq('slug', 'foto-prueba-b').maybeSingle()

const a = await signIn('provider-a@test.local')

console.log('\n1. Columnas protegidas (trigger)')
{
  // Debe partir de un estado distinto: actualizar 'published' -> 'published' no
  // cambia nada y el trigger lo dejaría pasar con razón.
  await service.from('providers').update({ status: 'draft' }).eq('id', provA.id)
  const { error } = await a.from('providers').update({ status: 'published' }).eq('id', provA.id)
  check('dueño NO puede auto-publicarse', !!error, error ? '' : '¡se publicó solo!')

  const { data: after } = await service
    .from('providers').select('status').eq('id', provA.id).maybeSingle()
  check('el estado siguió en draft', after?.status === 'draft', `quedó en ${after?.status}`)
}
{
  const { error } = await a.from('providers').update({ slug: 'slug-robado' }).eq('id', provA.id)
  check('dueño NO puede cambiar su slug', !!error)
}
{
  const { error } = await a
    .from('providers').update({ verification_status: 'verified' }).eq('id', provA.id)
  check('dueño NO puede auto-verificarse', !!error)
}
{
  const { error } = await a
    .from('providers').update({ description: 'descripción legítima del proveedor A' }).eq('id', provA.id)
  check('dueño SÍ puede editar su descripción', !error, error?.message ?? '')
}

console.log('\n2. Aislamiento entre proveedores')
{
  const { error, data } = await a
    .from('providers').update({ description: 'hackeado' }).eq('id', provB.id).select()
  check('no puede editar el perfil de otro', !!error || (data?.length ?? 0) === 0)
}
{
  const { data } = await a.from('provider_onboarding_progress').select('*').eq('provider_id', provB.id)
  check('no puede leer el progreso de otro', (data?.length ?? 0) === 0)
}

console.log('\n3. Visibilidad pública por estado')
for (const status of ['draft', 'pending_review', 'paused', 'rejected']) {
  await service.from('providers').update({ status }).eq('id', provA.id)
  const anon = createClient(URL, ANON)
  const { data } = await anon.from('providers').select('id').eq('id', provA.id)
  check(`'${status}' NO es visible al público`, (data?.length ?? 0) === 0)
}
await service.from('providers').update({ status: 'published' }).eq('id', provA.id)
{
  const anon = createClient(URL, ANON)
  const { data } = await anon.from('providers').select('id').eq('id', provA.id)
  check("'published' SÍ es visible al público", (data?.length ?? 0) === 1)
}

console.log('\n4. Datos derivados de la reclamación')
{
  const anon = createClient(URL, ANON)
  const { data } = await anon.from('claim_tokens').select('*')
  check('anon no puede leer claim_tokens', (data?.length ?? 0) === 0)
}
{
  const { error } = await a.rpc('redeem_claim_token', {
    p_token: '00000000-0000-0000-0000-000000000000',
    p_user_id: provB.id,
  })
  check('authenticated no puede ejecutar redeem_claim_token', !!error)
}
{
  const { error } = await a.rpc('check_rate_limit', { p_key: 'x', p_max: 1, p_window_seconds: 60 })
  check('authenticated no puede ejecutar check_rate_limit', !!error)
}

console.log('\n5. Intenciones de registro (datos de contacto)')
{
  const anon = createClient(URL, ANON)
  const { data } = await anon.from('provider_registration_intents').select('*')
  check('anon no puede leer intenciones de registro', (data?.length ?? 0) === 0)
  const { data: authed } = await a.from('provider_registration_intents').select('*')
  check('proveedor no puede leer intenciones de registro', (authed?.length ?? 0) === 0)
}

console.log('\n6. Un usuario = un perfil')
{
  const { error } = await service.from('providers').insert({
    name: 'Segundo perfil', slug: `dup-${Date.now()}`, status: 'draft', claimed_by: provA.claimed_by,
  })
  const { data: owner } = await service.from('providers').select('claimed_by').eq('id', provA.id).maybeSingle()
  if (owner?.claimed_by) {
    const { error: dupError } = await service.from('providers').insert({
      name: 'Segundo perfil', slug: `dup2-${Date.now()}`, status: 'draft', claimed_by: owner.claimed_by,
    })
    check('índice único impide un segundo perfil por usuario', !!dupError, dupError ? '' : '¡se creó duplicado!')
  } else {
    check('índice único impide un segundo perfil por usuario', !!error)
  }
}

console.log(`\n${pass} pasaron, ${fail} fallaron`)
process.exit(fail === 0 ? 0 : 1)
