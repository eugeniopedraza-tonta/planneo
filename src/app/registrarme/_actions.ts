'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { setOnboardingSession } from '@/lib/onboarding-session'
import { normalizeEmail, sendAccessCode } from '@/lib/otp'
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { trackOnboardingEvent } from '@/lib/onboarding-events'
import { sendDuplicateClaimRequest } from '@/lib/email'
import { parseRegistration } from './_schema'

export type DuplicateMatch = {
  id: string
  name: string
  categoryName: string | null
  zona: string | null
  photo: string | null
}

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
  /** Perfil parecido encontrado; el usuario decide si reclamarlo o seguir. */
  duplicate?: DuplicateMatch
  /** Confirmación tras pedir acceso a un perfil existente. */
  claimRequested?: boolean
}

/**
 * Cuatro decisiones y nada más. El perfil todavía no se crea: se envía el
 * código y los datos esperan firmados en una cookie hasta que el correo quede
 * verificado, para que un abandono no ensucie el catálogo con borradores.
 */
export async function startProviderRegistration(
  _prev: State,
  formData: FormData
): Promise<State> {
  const parsed = parseRegistration(formData)
  if (!parsed.data) return { fieldErrors: parsed.fieldErrors }

  const { business_name, category_id, zona } = parsed.data
  const email = normalizeEmail(parsed.data.email)

  // La deduplicación solo sugiere. Si el usuario ya la vio y decidió continuar,
  // se respeta: un falso positivo no puede bloquear a un negocio distinto.
  if (formData.get('skip_duplicate') !== '1') {
    const duplicate = await findPossibleDuplicate(business_name, category_id, zona)
    if (duplicate) {
      await trackOnboardingEvent('provider_duplicate_suggested', {
        providerId: duplicate.id,
        properties: { match_confidence: 'name_category' },
      })
      return { duplicate }
    }
  }

  const allowed = await checkRateLimit(rateLimitKey('register', email), 5, 15 * 60)
  if (!allowed) {
    return { error: 'Pediste demasiados códigos. Espera unos minutos e intenta de nuevo.' }
  }

  const service = createServiceClient()
  await service.from('provider_registration_intents').insert({
    email,
    business_name,
    category_id,
    zona,
    source: 'self_serve',
  })

  const { error } = await sendAccessCode(email)
  if (error) return { error }

  await setOnboardingSession({
    purpose: 'register',
    email,
    businessName: business_name,
    categoryId: category_id,
    zona,
  })

  await trackOnboardingEvent('provider_registration_started', {
    properties: { entry_point: 'self_serve' },
  })

  redirect('/verificar-acceso')
}

/**
 * El usuario dice que el perfil sugerido es suyo. Los enlaces de reclamación
 * los emite Planneo, así que aquí solo se solicita el acceso: nunca se entrega
 * un perfil ajeno por pedirlo.
 */
export async function requestExistingProfileAccess(
  _prev: State,
  formData: FormData
): Promise<State> {
  const providerId = z.uuid().safeParse(formData.get('provider_id'))
  const email = z.email().safeParse(formData.get('email'))

  if (!providerId.success || !email.success) {
    return { error: 'No pudimos registrar tu solicitud. Escríbenos a hola@planneo.mx.' }
  }

  const normalized = normalizeEmail(email.data)
  const allowed = await checkRateLimit(rateLimitKey('claim-request', normalized), 3, 60 * 60)
  if (!allowed) {
    return { error: 'Ya registramos tu solicitud. Te contactaremos pronto.' }
  }

  const service = createServiceClient()
  const { data: provider } = await service
    .from('providers')
    .select('name')
    .eq('id', providerId.data)
    .maybeSingle()

  if (provider?.name) {
    sendDuplicateClaimRequest(provider.name, normalized).catch(() => {})
  }

  await trackOnboardingEvent('provider_duplicate_suggested', {
    providerId: providerId.data,
    properties: { accepted_claim_path: true },
  })

  return { claimRequested: true }
}

/**
 * Coincidencia probable por nombre normalizado dentro de la misma categoría.
 * Devuelve solo datos que ya son públicos: nunca teléfono, email ni dueño.
 */
async function findPossibleDuplicate(
  businessName: string,
  categoryId: string,
  zona: string
): Promise<DuplicateMatch | null> {
  const service = createServiceClient()
  const normalized = normalizeName(businessName)
  if (normalized.length < 3) return null

  const { data } = await service
    .from('providers')
    .select('id, name, zona, photos, categories(name)')
    .eq('category_id', categoryId)
    .neq('status', 'rejected')
    .limit(50)

  const match = (data ?? []).find((row) => {
    const candidate = normalizeName(row.name)
    if (candidate === normalized) return true
    // Nombres muy cortos generan falsos positivos por inclusión.
    if (normalized.length >= 6 && candidate.includes(normalized)) return true
    if (candidate.length >= 6 && normalized.includes(candidate)) return true
    return false
  })

  if (!match) return null

  return {
    id: match.id,
    name: match.name,
    categoryName: (match.categories as unknown as { name: string } | null)?.name ?? null,
    zona: match.zona ?? zona,
    photo: match.photos?.[0] ?? null,
  }
}

/** Quita acentos, signos y palabras vacías para comparar nombres comerciales. */
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(el|la|los|las|de|del|y|studio|estudio)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
