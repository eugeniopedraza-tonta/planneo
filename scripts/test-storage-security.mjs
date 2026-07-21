// Pruebas de seguridad de Storage/RLS contra el stack LOCAL.
// Verifica que un proveedor no pueda tocar archivos ni registros de otro.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split(/=(.*)/s).slice(0, 2).map((s) => s.trim()))
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!url.includes('127.0.0.1')) throw new Error('Refusing: not local stack')
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY)

async function login(email) {
  const c = createClient(url, anonKey)
  const { error } = await c.auth.signInWithPassword({ email, password: 'test-password-123' })
  if (error) throw new Error(`login ${email}: ${error.message}`)
  return c
}

const { data: provs } = await service.from('providers').select('id, slug')
const provA = provs.find((p) => p.slug === 'foto-prueba-a').id
const provB = provs.find((p) => p.slug === 'foto-prueba-b').id

const a = await login('provider-a@test.local')
const b = await login('provider-b@test.local')

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

let pass = 0, fail = 0
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS  ${name}`) }
  else { fail++; console.log(`FAIL  ${name} ${detail}`) }
}

// 0. A sube a su propia carpeta (control positivo)
const aPath = `${provA}/control.png`
{
  const { error } = await a.storage.from('provider-photos').upload(aPath, png, { contentType: 'image/png' })
  check('A sube a su propia carpeta', !error, error?.message)
}

// 1. B NO puede subir a la carpeta de A
{
  const { error } = await b.storage.from('provider-photos').upload(`${provA}/evil.png`, png, { contentType: 'image/png' })
  check('B no puede subir a carpeta de A', !!error, 'subida permitida!')
}

// 2. B NO puede sobrescribir el archivo de A (upsert)
{
  const { error } = await b.storage.from('provider-photos').upload(aPath, png, { contentType: 'image/png', upsert: true })
  check('B no puede sobrescribir archivo de A', !!error, 'sobrescritura permitida!')
}

// 3. B NO puede crear signed upload URL hacia carpeta de A
{
  const { error } = await b.storage.from('provider-photos').createSignedUploadUrl(`${provA}/evil2.png`)
  check('B no puede firmar carga hacia carpeta de A', !!error, 'firma permitida!')
}

// 4. B SÍ puede firmar carga hacia su propia carpeta y subir con el token
{
  const { data, error } = await b.storage.from('provider-photos').createSignedUploadUrl(`${provB}/own.png`)
  let ok = !error && data?.token
  if (ok) {
    const up = await b.storage.from('provider-photos').uploadToSignedUrl(data.path, data.token, png, { contentType: 'image/png' })
    ok = !up.error
  }
  check('B firma y sube a su propia carpeta', !!ok, error?.message)
}

// 5. B NO puede borrar el archivo de A (remove no falla, pero el objeto debe seguir)
{
  await b.storage.from('provider-photos').remove([aPath])
  const { data } = await service.storage.from('provider-photos').exists(aPath)
  check('B no puede borrar archivo de A', data === true, 'archivo de A borrado!')
}

// 6. B NO puede insertar provider_media apuntando al proveedor A
{
  const { error } = await b.from('provider_media').insert({
    provider_id: provA, type: 'photo', bucket: 'provider-photos',
    path: `${provA}/fake.png`, url: 'x',
  })
  check('B no puede registrar media de A', !!error, 'insert permitido!')
}

// 7. B NO puede modificar media de A (0 filas afectadas)
{
  const { data: row } = await service.from('provider_media')
    .insert({ provider_id: provA, type: 'photo', bucket: 'provider-photos', path: aPath, url: 'x' })
    .select('id').single()
  const { data } = await b.from('provider_media').update({ alt_text: 'hack' }).eq('id', row.id).select()
  check('B no puede modificar media de A', (data ?? []).length === 0, 'update afectó filas!')
  const { data: del } = await b.from('provider_media').delete().eq('id', row.id).select()
  check('B no puede borrar media de A', (del ?? []).length === 0, 'delete afectó filas!')
}

// 8. Público (anon) puede leer la foto de un proveedor publicado
{
  const res = await fetch(`${url}/storage/v1/object/public/provider-photos/${aPath}`)
  check('Anon lee foto de proveedor publicado', res.status === 200, `status ${res.status}`)
}

// 9. Formato no permitido rechazado por el bucket (SVG)
{
  const { error } = await a.storage.from('provider-photos').upload(`${provA}/x.svg`, Buffer.from('<svg/>'), { contentType: 'image/svg+xml' })
  check('Bucket rechaza SVG', !!error, 'SVG aceptado!')
}

console.log(`\n${pass} PASS / ${fail} FAIL`)
process.exit(fail ? 1 : 0)
