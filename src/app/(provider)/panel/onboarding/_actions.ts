'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { loadOnboardingState } from '../../_lib/readiness'
import {
  EVENT_TYPE_VALUES,
  MIN_DESCRIPTION_LENGTH,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from '@/lib/constants'
import { getPublicationPolicy, statusAfterPublicationRequest } from '@/lib/publication-policy'
import { trackOnboardingEvent } from '@/lib/onboarding-events'
import { sendRegistrationNotification } from '@/lib/email'

export type State = { error?: string; success?: boolean }

/** Resuelve la sesión y el perfil del que es dueño. Todo pasa por aquí. */
async function requireOwnedProvider() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await loadOnboardingState(supabase, user.id)
  if (!state) redirect('/registrarme')

  return { supabase, user, state }
}

export async function acceptTerms(): Promise<State> {
  const { state } = await requireOwnedProvider()
  const now = new Date().toISOString()

  const service = createServiceClient()
  const { error } = await service.from('provider_onboarding_progress').upsert({
    provider_id: state.provider.id,
    terms_version: TERMS_VERSION,
    terms_accepted_at: now,
    privacy_version: PRIVACY_VERSION,
    privacy_accepted_at: now,
    last_task: 'terms',
    last_seen_at: now,
  })

  if (error) return { error: 'No pudimos guardar tu aceptación. Intenta de nuevo.' }

  await trackOnboardingEvent('provider_task_completed', {
    providerId: state.provider.id,
    properties: { task: 'terms' },
  })

  revalidatePath('/panel/onboarding')
  return { success: true }
}

const EventTypesSchema = z
  .array(z.enum(EVENT_TYPE_VALUES))
  .min(1, 'Elige al menos un tipo de evento')

export async function saveEventTypes(_prev: State, formData: FormData): Promise<State> {
  const { supabase, state } = await requireOwnedProvider()

  const parsed = EventTypesSchema.safeParse(formData.getAll('event_types'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('providers')
    .update({ event_types: parsed.data })
    .eq('id', state.provider.id)

  if (error) return { error: 'No pudimos guardar los tipos de evento.' }

  await trackOnboardingEvent('provider_task_completed', {
    providerId: state.provider.id,
    properties: { task: 'event_types' },
  })

  revalidatePath('/panel/onboarding')
  redirect('/panel/onboarding')
}

const DescriptionSchema = z
  .string()
  .trim()
  .min(MIN_DESCRIPTION_LENGTH, `Escribe al menos ${MIN_DESCRIPTION_LENGTH} caracteres`)
  .max(2000)

export async function saveDescription(_prev: State, formData: FormData): Promise<State> {
  const { supabase, state } = await requireOwnedProvider()

  const parsed = DescriptionSchema.safeParse(formData.get('description'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('providers')
    .update({ description: parsed.data })
    .eq('id', state.provider.id)

  if (error) return { error: 'No pudimos guardar la descripción.' }

  await trackOnboardingEvent('provider_task_completed', {
    providerId: state.provider.id,
    properties: { task: 'description' },
  })

  revalidatePath('/panel/onboarding')
  redirect('/panel/onboarding')
}

/**
 * Publicación. La validación que manda es esta, no la interfaz: el checklist
 * puede estar desactualizado o alguien puede llamar la acción directamente, así
 * que la readiness se recalcula desde la base antes de cambiar nada.
 */
export async function requestProviderPublication(): Promise<State> {
  const { user, state } = await requireOwnedProvider()

  if (!state.readiness.isReady) {
    return { error: 'Todavía faltan tareas obligatorias para publicar tu perfil.' }
  }

  if (state.provider.status === 'published') {
    return { error: 'Tu perfil ya está activo.' }
  }

  const nextStatus = statusAfterPublicationRequest()
  const now = new Date().toISOString()

  // Service client: el trigger de la base impide que un dueño cambie su propio
  // status, justamente para que este sea el único camino.
  const service = createServiceClient()
  const { error } = await service
    .from('providers')
    .update({
      status: nextStatus,
      onboarding_completed_at: now,
      ...(nextStatus === 'published' ? { published_at: now, paused_at: null } : {}),
    })
    .eq('id', state.provider.id)

  if (error) return { error: 'No pudimos enviar tu perfil. Intenta de nuevo.' }

  await trackOnboardingEvent('provider_ready_to_publish', {
    providerId: state.provider.id,
    userId: user.id,
    properties: { policy: getPublicationPolicy() },
  })

  if (nextStatus === 'published') {
    await trackOnboardingEvent('provider_published', {
      providerId: state.provider.id,
      userId: user.id,
      properties: { source: 'self_publish' },
    })
    revalidatePublicPages(state.provider.categories?.slug, state.provider.slug)
  } else if (user.email) {
    sendRegistrationNotification(state.provider.name, user.email).catch(() => {})
  }

  revalidatePath('/panel/onboarding')
  revalidatePath('/panel')
  redirect('/panel/onboarding/listo')
}

export async function pauseProviderProfile(): Promise<State> {
  const { user, state } = await requireOwnedProvider()

  const service = createServiceClient()
  const { error } = await service
    .from('providers')
    .update({ status: 'paused', paused_at: new Date().toISOString() })
    .eq('id', state.provider.id)

  if (error) return { error: 'No pudimos pausar tu perfil. Intenta de nuevo.' }

  await trackOnboardingEvent('provider_paused', {
    providerId: state.provider.id,
    userId: user.id,
  })

  revalidatePublicPages(state.provider.categories?.slug, state.provider.slug)
  revalidatePath('/panel')
  revalidatePath('/panel/onboarding')
  return { success: true }
}

export async function resumeProviderProfile(): Promise<State> {
  const { state } = await requireOwnedProvider()

  if (!state.readiness.isReady) {
    return { error: 'Completa las tareas pendientes antes de reactivar tu perfil.' }
  }

  const now = new Date().toISOString()
  const nextStatus = statusAfterPublicationRequest()

  const service = createServiceClient()
  const { error } = await service
    .from('providers')
    .update({
      status: nextStatus,
      paused_at: null,
      ...(nextStatus === 'published' ? { published_at: now } : {}),
    })
    .eq('id', state.provider.id)

  if (error) return { error: 'No pudimos reactivar tu perfil. Intenta de nuevo.' }

  revalidatePublicPages(state.provider.categories?.slug, state.provider.slug)
  revalidatePath('/panel')
  revalidatePath('/panel/onboarding')
  return { success: true }
}

/** El perfil público usa ISR; sin esto tardaría hasta una hora en reflejarse. */
function revalidatePublicPages(categorySlug?: string, slug?: string) {
  if (categorySlug && slug) revalidatePath(`/${categorySlug}/${slug}`)
  revalidatePath('/proveedores')
  revalidatePath('/sitemap.xml')
}
