// Crea usuarios y proveedores de prueba en el stack LOCAL de Supabase.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('/Users/pedraza/Developer/planneo/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split(/=(.*)/s).slice(0, 2).map((s) => s.trim()))
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!url.includes('127.0.0.1')) throw new Error('Refusing: not local stack')
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY)

async function ensureUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
    app_metadata: { role },
  })
  if (error) throw new Error(`${email}: ${error.message}`)
  return data.user.id
}

const adminId = await ensureUser('admin@test.local', 'admin')
const aId = await ensureUser('provider-a@test.local', 'provider')
const bId = await ensureUser('provider-b@test.local', 'provider')

const { data: cat } = await admin.from('categories').select('id').eq('slug', 'fotografia').single()

const { data: provA, error: eA } = await admin.from('providers').insert({
  name: 'Foto Prueba A', slug: 'foto-prueba-a', category_id: cat.id,
  status: 'published', claimed_by: aId,
}).select('id').single()
if (eA) throw eA
const { data: provB, error: eB } = await admin.from('providers').insert({
  name: 'Foto Prueba B', slug: 'foto-prueba-b', category_id: cat.id,
  status: 'published', claimed_by: bId,
}).select('id').single()
if (eB) throw eB

console.log(JSON.stringify({ adminId, aId, bId, provA: provA.id, provB: provB.id }))
