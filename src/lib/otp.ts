import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const ACCESS_EMAIL_MESSAGE = 'Escribe un correo válido. Ahí te llega tu acceso.'
export const ACCESS_CODE_MESSAGE = 'Escribe los 6 dígitos del código que te enviamos.'

/** Correo de acceso con mensaje en español para cualquier fallo (vacío, null, formato). */
export const AccessEmailSchema = z
  .string({ error: ACCESS_EMAIL_MESSAGE })
  .trim()
  .pipe(z.email({ error: ACCESS_EMAIL_MESSAGE }).max(200, { error: ACCESS_EMAIL_MESSAGE }))

/** Código OTP de 6 dígitos; tolera espacios al pegarlo. */
export const AccessCodeSchema = z
  .string({ error: ACCESS_CODE_MESSAGE })
  .transform((value) => value.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{6}$/, { error: ACCESS_CODE_MESSAGE }))

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

  // Con createUser=false (login) Supabase responde "Signups not allowed for
  // otp" si el correo no tiene cuenta. Se trata como envío exitoso para no
  // revelar qué correos están registrados; la pantalla del código lo aclara.
  if (!createUser && (error.code === 'otp_disabled' || message.includes('signups not allowed'))) {
    return {}
  }

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
): Promise<{ userId?: string; role?: unknown; error?: string }> {
  const supabase = await createClient()
  const normalized = normalizeEmail(email)

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'email',
  })

  if (!error && data.user) return { userId: data.user.id, role: data.user.app_metadata?.role }

  const fallback = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'signup',
  })

  if (!fallback.error && fallback.data.user) {
    return { userId: fallback.data.user.id, role: fallback.data.user.app_metadata?.role }
  }

  return { error: 'Ese código no coincide. Intenta de nuevo o pide otro.' }
}
