'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { setOnboardingSession } from '@/lib/onboarding-session'
import { AccessEmailSchema, normalizeEmail, sendAccessCode } from '@/lib/otp'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { trackOnboardingEvent } from '@/lib/onboarding-events'
import { sendWelcomeEmail } from '@/lib/email'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

// `error` en el constructor cubre también el campo ausente (null), para que
// nunca llegue a pantalla el texto genérico de zod en inglés.
const ClaimSchema = z.object({
  contact_name: z
    .string({ error: 'Escribe tu nombre.' })
    .trim()
    .min(2, { error: 'Escribe tu nombre.' })
    .max(80, { error: 'Usa máximo 80 caracteres.' }),
  email: AccessEmailSchema,
  phone: z
    .string({ error: 'Escribe un teléfono de contacto.' })
    .trim()
    .min(8, { error: 'Escribe un teléfono de contacto.' })
    .max(40, { error: 'Usa máximo 40 caracteres.' }),
})

/**
 * Paso 1 de la reclamación: guarda los datos firmados en una cookie y envía el
 * código. El perfil no cambia de dueño hasta que el correo queda verificado en
 * /verificar-acceso.
 */
export async function startClaim(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const parsed = ClaimSchema.safeParse({
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  })

  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors }

  const tokenCheck = z.string().uuid().safeParse(token)
  if (!tokenCheck.success) return { error: 'Este enlace ya no es válido. Solicita uno nuevo a Planneo.' }

  const email = normalizeEmail(parsed.data.email)

  const allowed = await checkRateLimit(rateLimitKey('claim', email), 5, 15 * 60)
  if (!allowed) {
    return { error: 'Pediste demasiados códigos. Espera unos minutos e intenta de nuevo.' }
  }

  // Se revalida el token antes de mandar el correo para no hacerle perder el
  // tiempo a alguien con un enlace muerto. La validación que cuenta es la de
  // la RPC, que corre en una transacción al verificar.
  const service = createServiceClient()
  const { data: tokenRow } = await service
    .from('claim_tokens')
    .select('id, expires_at, used_at, revoked_at')
    .eq('token', tokenCheck.data)
    .maybeSingle()

  if (!tokenRow || tokenRow.used_at || tokenRow.revoked_at) {
    return { error: 'Este enlace ya no es válido. Solicita uno nuevo a Planneo.' }
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return { error: 'Este enlace ya expiró. Solicita uno nuevo a Planneo.' }
  }

  const { error } = await sendAccessCode(email)
  if (error) return { error }

  await setOnboardingSession({
    purpose: 'claim',
    email,
    token: tokenCheck.data,
    contactName: parsed.data.contact_name,
    phone: parsed.data.phone,
  })

  redirect('/verificar-acceso')
}

/**
 * Camino sin OTP para quien ya inició sesión. Aun así exige una confirmación
 * explícita: el enlace pudo llegar reenviado y no se debe vincular un negocio
 * a una cuenta por el solo hecho de abrir la página.
 */
export async function claimAsCurrentUser(token: string): Promise<State> {
  const tokenCheck = z.string().uuid().safeParse(token)
  if (!tokenCheck.success) return { error: 'Este enlace ya no es válido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Vuelve a intentarlo.' }

  const service = createServiceClient()
  const { data, error } = await service.rpc('redeem_claim_token', {
    p_token: tokenCheck.data,
    p_user_id: user.id,
    p_phone: null,
  })

  if (error) return { error: 'No pudimos activar el perfil. Intenta de nuevo.' }

  const outcome = data as { ok: boolean; error?: string; provider_id?: string }
  if (!outcome?.ok) {
    return {
      error:
        outcome?.error === 'used'
          ? 'Este perfil ya fue reclamado.'
          : 'Este enlace ya no es válido. Solicita uno nuevo a Planneo.',
    }
  }

  if (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'provider') {
    await service.auth.admin.updateUserById(user.id, { app_metadata: { role: 'provider' } })
    await supabase.auth.refreshSession()
  }

  const { data: provider } = await service
    .from('providers')
    .select('name')
    .eq('id', outcome.provider_id!)
    .maybeSingle()

  if (provider?.name && user.email) sendWelcomeEmail(user.email, provider.name).catch(() => {})

  await trackOnboardingEvent('provider_access_verified', {
    providerId: outcome.provider_id,
    userId: user.id,
    properties: { entry_point: 'claim_logged_in' },
  })

  redirect('/panel/onboarding')
}

/**
 * "Este no es mi negocio". Se registra el incidente pero **no** se revoca el
 * token: un clic equivocado no debe dejar sin acceso al dueño legítimo. Queda
 * marcado para que Planneo lo revise.
 *
 * Es un envío de formulario y no un efecto al abrir la pantalla de ayuda: Next
 * precarga los <Link> al pasar el cursor, así que un simple hover habría
 * levantado reportes falsos.
 */
export async function reportWrongBusiness(token: string): Promise<State> {
  const tokenCheck = z.string().uuid().safeParse(token)
  if (!tokenCheck.success) redirect('/')

  const service = createServiceClient()
  const { data: tokenRow } = await service
    .from('claim_tokens')
    .select('id, provider_id')
    .eq('token', tokenCheck.data)
    .maybeSingle()

  if (tokenRow) {
    await service
      .from('claim_tokens')
      .update({ reported_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    await trackOnboardingEvent('provider_claim_rejected', {
      providerId: tokenRow.provider_id,
      properties: { reason: 'not_my_business' },
    })
  }

  redirect(`/reclamar/${tokenCheck.data}/no-es-mio`)
}
