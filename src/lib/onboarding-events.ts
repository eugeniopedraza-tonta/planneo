import { createServiceClient } from '@/lib/supabase/server'

export type OnboardingEventName =
  | 'provider_onboarding_viewed'
  | 'provider_claim_previewed'
  | 'provider_claim_rejected'
  | 'provider_registration_started'
  | 'provider_duplicate_suggested'
  | 'provider_access_verified'
  | 'provider_task_completed'
  | 'provider_ready_to_publish'
  | 'provider_published'
  | 'provider_paused'

/**
 * Registra un evento de onboarding del lado servidor.
 *
 * Es deliberadamente fire-and-forget: la analítica nunca debe hacer fallar el
 * flujo del proveedor. Las propiedades deben ser agregables (categoría, origen,
 * duración); no se guardan email, teléfono, nombres ni tokens.
 */
export async function trackOnboardingEvent(
  eventName: OnboardingEventName,
  {
    providerId,
    userId,
    properties = {},
  }: {
    providerId?: string | null
    userId?: string | null
    properties?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    const service = createServiceClient()
    await service.from('provider_onboarding_events').insert({
      provider_id: providerId ?? null,
      user_id: userId ?? null,
      event_name: eventName,
      properties,
    })
  } catch {
    // Silencio intencional: ver comentario del encabezado.
  }
}

/** Horas transcurridas desde una fecha ISO, para propiedades como `token_age_hours`. */
export function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.round(ms / 3_600_000)
}
