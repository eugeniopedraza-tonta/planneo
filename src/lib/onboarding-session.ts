import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'

const COOKIE_NAME = 'planneo_onboarding'
const MAX_AGE_SECONDS = 15 * 60

/**
 * Datos que viajan entre el formulario y la pantalla de verificación.
 *
 * Van firmados porque el usuario controla sus propias cookies: `httpOnly` evita
 * que las lea JavaScript, no que las reemplace. Sin firma, cualquiera podría
 * fabricar una cookie con el token de reclamación de otro negocio.
 */
const OnboardingSessionSchema = z.discriminatedUnion('purpose', [
  z.object({
    purpose: z.literal('claim'),
    email: z.string().email(),
    token: z.string().uuid(),
    contactName: z.string().min(2).max(80),
    phone: z.string().max(40).optional(),
  }),
  z.object({
    purpose: z.literal('register'),
    email: z.string().email(),
    businessName: z.string().min(2).max(120),
    categoryId: z.string().uuid(),
    zona: z.string().max(80),
  }),
])

export type OnboardingSession = z.infer<typeof OnboardingSessionSchema>

function secret(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error('SUPABASE_SERVICE_ROLE_KEY es necesaria para firmar el onboarding')
  return value
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function verify(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

export async function setOnboardingSession(session: OnboardingSession): Promise<void> {
  const body = JSON.stringify({ ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  const payload = Buffer.from(body).toString('base64url')
  const store = await cookies()

  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
}

/**
 * Lee la cookie y revalida su contenido con el mismo esquema con que se
 * escribió: aunque esté firmada, sigue siendo entrada influida por el usuario.
 */
export async function getOnboardingSession(): Promise<OnboardingSession | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null

  const [payload, signature] = raw.split('.')
  if (!payload || !signature || !verify(payload, signature)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof decoded.exp !== 'number' || decoded.exp < Date.now()) return null

    const parsed = OnboardingSessionSchema.safeParse(decoded)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function clearOnboardingSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
