'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  clearOnboardingSession,
  getOnboardingSession,
  type OnboardingSession,
} from '@/lib/onboarding-session'
import { sendAccessCode, verifyAccessCode } from '@/lib/otp'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { trackOnboardingEvent } from '@/lib/onboarding-events'
import { generateProviderSlug, slugify } from '@/lib/slug'
import { sendWelcomeEmail } from '@/lib/email'
import { ZONA_OPTIONS } from '@/lib/constants'

export type State = {
  error?: string
  /** Se muestra tras un reenvío exitoso. */
  notice?: string
}

const CodeSchema = z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos')

export async function verifyAccess(_prev: State, formData: FormData): Promise<State> {
  const session = await getOnboardingSession()
  if (!session) {
    return { error: 'Tu sesión de registro expiró. Vuelve a empezar.' }
  }

  if (formData.get('resend') === '1') {
    const allowed = await checkRateLimit(rateLimitKey('otp', session.email), 5, 15 * 60)
    if (!allowed) {
      return { error: 'Pediste demasiados códigos. Espera unos minutos e intenta de nuevo.' }
    }
    const { error } = await sendAccessCode(session.email)
    return error ? { error } : { notice: 'Te enviamos un código nuevo.' }
  }

  const code = CodeSchema.safeParse(formData.get('code'))
  if (!code.success) return { error: code.error.issues[0].message }

  const attempts = await checkRateLimit(rateLimitKey('otp-verify', session.email), 10, 15 * 60)
  if (!attempts) {
    return { error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.' }
  }

  const { userId, error } = await verifyAccessCode(session.email, code.data)
  if (error || !userId) return { error: error ?? 'No pudimos verificar el código.' }

  const result =
    session.purpose === 'claim'
      ? await completeClaim(session, userId)
      : await completeRegistration(session, userId)

  if (result.error) return { error: result.error }

  await clearOnboardingSession()

  // Fuera de cualquier try/catch: redirect() funciona lanzando NEXT_REDIRECT.
  redirect('/panel/onboarding')
}

/** Reclamación: la RPC valida el token y asigna la propiedad en una transacción. */
async function completeClaim(
  session: Extract<OnboardingSession, { purpose: 'claim' }>,
  userId: string
): Promise<{ error?: string }> {
  const service = createServiceClient()

  const { data, error } = await service.rpc('redeem_claim_token', {
    p_token: session.token,
    p_user_id: userId,
    p_phone: session.phone ?? null,
  })

  if (error) return { error: 'No pudimos activar el perfil. Intenta de nuevo.' }

  const outcome = data as { ok: boolean; error?: string; provider_id?: string }
  if (!outcome?.ok) return { error: claimErrorMessage(outcome?.error) }

  await promoteToProvider(userId, session.contactName)

  const { data: provider } = await service
    .from('providers')
    .select('name, category_id')
    .eq('id', outcome.provider_id!)
    .maybeSingle()

  if (provider?.name) sendWelcomeEmail(session.email, provider.name).catch(() => {})

  await trackOnboardingEvent('provider_access_verified', {
    providerId: outcome.provider_id,
    userId,
    properties: { entry_point: 'claim' },
  })

  return {}
}

/**
 * Registro desde cero: hasta aquí no existía ningún perfil, solo una intención.
 * Así un abandono antes del código no deja borradores huérfanos en el catálogo.
 */
async function completeRegistration(
  session: Extract<OnboardingSession, { purpose: 'register' }>,
  userId: string
): Promise<{ error?: string }> {
  const service = createServiceClient()

  // Un usuario solo puede tener un perfil (índice único en claimed_by).
  const { data: existing } = await service
    .from('providers')
    .select('id')
    .eq('claimed_by', userId)
    .maybeSingle()

  if (existing) {
    await promoteToProvider(userId)
    return {}
  }

  // La cookie está firmada, pero su contenido sigue siendo entrada del usuario.
  const { data: category } = await service
    .from('categories')
    .select('id')
    .eq('id', session.categoryId)
    .maybeSingle()

  if (!category) return { error: 'La categoría elegida ya no está disponible.' }

  const zona = (ZONA_OPTIONS as readonly string[]).includes(session.zona) ? session.zona : null

  const { data: provider, error } = await service
    .from('providers')
    .insert({
      name: session.businessName,
      slug: await uniqueSlug(service, session.businessName, zona),
      category_id: session.categoryId,
      status: 'draft',
      claimed_by: userId,
      zona,
      email: session.email,
      source: 'self_serve',
    })
    .select('id')
    .single()

  if (error || !provider) {
    return { error: 'No pudimos crear tu borrador. Contáctanos en hola@planneo.mx.' }
  }

  await service
    .from('provider_onboarding_progress')
    .upsert({ provider_id: provider.id, last_task: 'basics', last_seen_at: new Date().toISOString() })

  await promoteToProvider(userId)

  await trackOnboardingEvent('provider_access_verified', {
    providerId: provider.id,
    userId,
    properties: { entry_point: 'self_serve' },
  })

  return {}
}

/**
 * Asigna el rol y refresca la sesión: el rol viaja en el JWT, así que sin
 * refrescar el proxy seguiría viendo al usuario sin acceso al panel.
 */
async function promoteToProvider(userId: string, contactName?: string) {
  const service = createServiceClient()
  const { data: userData } = await service.auth.admin.getUserById(userId)

  // Nunca degradar a un admin que reclame un perfil de prueba.
  if (userData.user?.app_metadata?.role !== 'admin') {
    await service.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'provider' },
      ...(contactName ? { user_metadata: { contact_name: contactName } } : {}),
    })
  }

  const supabase = await createClient()
  await supabase.auth.refreshSession()
}

function claimErrorMessage(code?: string): string {
  switch (code) {
    case 'used':
      return 'Este perfil ya fue reclamado. Inicia sesión si es tu cuenta.'
    case 'expired':
      return 'Este enlace ya no es válido. Solicita uno nuevo a Planneo.'
    case 'already_claimed':
      return 'Este perfil ya tiene dueño. Escríbenos a hola@planneo.mx si crees que es un error.'
    default:
      return 'Este enlace ya no es válido. Solicita uno nuevo a Planneo.'
  }
}

async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  name: string,
  zona: string | null
): Promise<string> {
  const base = zona ? generateProviderSlug(name, zona) : slugify(name)
  let candidate = base
  for (let i = 1; ; i++) {
    const { data } = await service.from('providers').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i}`
  }
}
