'use server'

import { redirect } from 'next/navigation'
import {
  AccessCodeSchema,
  AccessEmailSchema,
  normalizeEmail,
  sendAccessCode,
  verifyAccessCode,
} from '@/lib/otp'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { homeForRole } from '@/lib/auth-routes'
import { safeNextPath } from './_next'

export type LoginState = {
  /** Paso visible: pedir correo o escribir el código. */
  step: 'email' | 'code'
  email?: string
  error?: string
  notice?: string
  fieldErrors?: { email?: string[]; code?: string[] }
}

/**
 * Acceso sin contraseña: el mismo código por correo que usa el registro.
 * Sirve para proveedores y admins; `createUser: false` evita que el login
 * cree cuentas nuevas (eso solo pasa en /registrarme).
 */
export async function loginWithCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // El botón de reenvío manda su propio campo: `intent` oculto vale 'verify'.
  const intent = formData.get('resend') === '1' ? 'resend' : formData.get('intent')

  const parsedEmail = AccessEmailSchema.safeParse(formData.get('email'))
  if (!parsedEmail.success) {
    return { step: 'email', fieldErrors: { email: [parsedEmail.error.issues[0].message] } }
  }
  const email = normalizeEmail(parsedEmail.data)

  if (intent === 'request' || intent === 'resend') {
    const allowed = await checkRateLimit(rateLimitKey('login', email), 5, 15 * 60)
    if (!allowed) {
      return {
        step: intent === 'resend' ? 'code' : 'email',
        email,
        error: 'Pediste demasiados códigos. Espera unos minutos e intenta de nuevo.',
      }
    }

    const { error } = await sendAccessCode(email, { createUser: false })
    if (error) return { step: intent === 'resend' ? 'code' : 'email', email, error }

    return {
      step: 'code',
      email,
      notice: intent === 'resend' ? 'Te enviamos un código nuevo.' : undefined,
    }
  }

  const code = AccessCodeSchema.safeParse(formData.get('code'))
  if (!code.success) {
    return { step: 'code', email, fieldErrors: { code: [code.error.issues[0].message] } }
  }

  const attempts = await checkRateLimit(rateLimitKey('otp-verify', email), 10, 15 * 60)
  if (!attempts) {
    return {
      step: 'code',
      email,
      error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
    }
  }

  const { userId, role, error } = await verifyAccessCode(email, code.data)
  if (error || !userId) {
    return {
      step: 'code',
      email,
      fieldErrors: { code: [error ?? 'No pudimos verificar el código.'] },
    }
  }

  // Fuera de cualquier try/catch: redirect() funciona lanzando NEXT_REDIRECT.
  redirect(safeNextPath(formData.get('next')) ?? homeForRole(role))
}
