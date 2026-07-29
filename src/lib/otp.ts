import { createClient } from '@/lib/supabase/server'

/** Normaliza el email para que sea la misma clave en OTP, rate limit y dedup. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Envía un código de 6 dígitos al correo.
 *
 * `signInWithOtp` sirve tanto para altas como para regresos: si el usuario no
 * existe lo crea (plantilla "Confirm signup"), y si ya existe le manda el
 * código igual (plantilla "Magic Link"). Nunca toca la contraseña, así que
 * quien ya tenía una conserva las dos formas de entrar.
 */
export async function sendAccessCode(
  email: string,
  { createUser = true }: { createUser?: boolean } = {}
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: { shouldCreateUser: createUser },
  })

  if (!error) return {}

  const message = error.message.toLowerCase()
  if (message.includes('rate') || message.includes('security purposes')) {
    return { error: 'Pediste varios códigos seguidos. Espera un minuto e intenta de nuevo.' }
  }
  return { error: 'No pudimos enviar el código. Revisa el correo e intenta de nuevo.' }
}

/**
 * Verifica el código y deja la sesión iniciada en las cookies.
 *
 * El tipo correcto es 'email' para ambas ramas de `signInWithOtp`; se reintenta
 * con 'signup' porque las cuentas creadas por el registro viejo (signUp con
 * contraseña) emiten un token de ese tipo.
 */
export async function verifyAccessCode(
  email: string,
  code: string
): Promise<{ userId?: string; error?: string }> {
  const supabase = await createClient()
  const normalized = normalizeEmail(email)

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'email',
  })

  if (!error && data.user) return { userId: data.user.id }

  const fallback = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'signup',
  })

  if (!fallback.error && fallback.data.user) return { userId: fallback.data.user.id }

  return { error: 'Ese código no coincide. Intenta de nuevo o pide otro.' }
}
