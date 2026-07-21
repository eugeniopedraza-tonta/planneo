// Prueba end-to-end del flujo de verificación por código OTP con Supabase Auth
// en el stack LOCAL: signUp → código en Mailpit → verifyOtp → rol → recovery.
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

const MAILPIT = 'http://127.0.0.1:54324'
const anon = () =>
  createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY)

async function latestCodeFor(email, notMessageId) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`
    )
    const { messages } = await res.json()
    const msg = messages?.[0]
    if (msg && msg.ID !== notMessageId) {
      const detail = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()
      const match = `${detail.Text ?? ''}\n${detail.HTML ?? ''}`.match(/\b(\d{6})\b/)
      if (match) return { code: match[1], messageId: msg.ID }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`No llegó el código para ${email} a Mailpit`)
}

const email = `otp-test-${Date.now()}@test.local`
const password = 'clave-inicial-123'
let userId

try {
  // 1. signUp: debe crear usuario sin confirmar y enviar el código
  const c1 = anon()
  const { data: signUpData, error: signUpError } = await c1.auth.signUp({
    email,
    password,
    options: { data: { name: 'Prueba OTP' } },
  })
  if (signUpError) throw new Error(`signUp: ${signUpError.message}`)
  if (signUpData.session) throw new Error('signUp NO debería devolver sesión (confirmaciones activas)')
  userId = signUpData.user?.id
  console.log('✓ signUp sin sesión (requiere confirmación)')

  // 2. leer el código del correo en Mailpit
  const { code, messageId } = await latestCodeFor(email)
  console.log(`✓ código recibido por correo: ${code}`)

  // 3. verifyOtp confirma el email e inicia sesión
  const c2 = anon()
  let verify = await c2.auth.verifyOtp({ email, token: code, type: 'email' })
  if (verify.error) {
    console.log(`  (type 'email' falló: ${verify.error.message}; probando 'signup')`)
    verify = await c2.auth.verifyOtp({ email, token: code, type: 'signup' })
  }
  if (verify.error) throw new Error(`verifyOtp: ${verify.error.message}`)
  if (!verify.data.session) throw new Error('verifyOtp no devolvió sesión')
  console.log('✓ verifyOtp confirmó el email y devolvió sesión')

  // 4. asignar rol con service role y comprobarlo
  const { error: roleError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'client' },
  })
  if (roleError) throw new Error(`updateUserById: ${roleError.message}`)
  const { data: fresh } = await admin.auth.admin.getUserById(userId)
  if (fresh.user.app_metadata?.role !== 'client') throw new Error('rol no asignado')
  console.log('✓ rol client asignado en app_metadata')

  // 5. signUp duplicado: error explícito o usuario ofuscado sin identidades
  const c3 = anon()
  const { data: dup, error: dupError } = await c3.auth.signUp({ email, password: 'otra-clave-456' })
  const dupDetected =
    (dupError && dupError.message.toLowerCase().includes('already registered')) ||
    (!dupError && (dup.user?.identities?.length ?? 0) === 0)
  if (!dupDetected) {
    throw new Error(`signUp duplicado no detectable: ${dupError?.message ?? 'devolvió usuario con identidades'}`)
  }
  console.log(`✓ signUp duplicado detectable (${dupError ? 'error explícito' : 'identities vacías'})`)

  // 6. recovery: código nuevo → verifyOtp recovery → updateUser password
  const c4 = anon()
  const { error: resetError } = await c4.auth.resetPasswordForEmail(email)
  if (resetError) throw new Error(`resetPasswordForEmail: ${resetError.message}`)
  const { code: recoveryCode } = await latestCodeFor(email, messageId)
  console.log(`✓ código de recovery recibido: ${recoveryCode}`)

  const verifyRec = await c4.auth.verifyOtp({ email, token: recoveryCode, type: 'recovery' })
  if (verifyRec.error) throw new Error(`verifyOtp recovery: ${verifyRec.error.message}`)
  const newPassword = 'clave-nueva-789'
  const { error: updError } = await c4.auth.updateUser({ password: newPassword })
  if (updError) throw new Error(`updateUser: ${updError.message}`)
  console.log('✓ contraseña actualizada vía recovery')

  // 7. login con la nueva contraseña
  const c5 = anon()
  const { error: loginError } = await c5.auth.signInWithPassword({ email, password: newPassword })
  if (loginError) throw new Error(`login con nueva contraseña: ${loginError.message}`)
  console.log('✓ login con la nueva contraseña funciona')

  console.log('\nTodo el flujo OTP nativo de Supabase funciona ✔')
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {})
}
