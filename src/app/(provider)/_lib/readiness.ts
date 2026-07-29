import { createClient } from '@/lib/supabase/server'
import { getProviderReadiness, type ReadinessResult } from '@/lib/provider-readiness'
import type { EventType, Provider, ProviderOnboardingProgress } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

export type OnboardingProviderSnapshot = Pick<
  Provider,
  | 'id'
  | 'name'
  | 'slug'
  | 'status'
  | 'category_id'
  | 'zona'
  | 'phone'
  | 'description'
  | 'event_types'
  | 'photos'
  | 'instagram_handle'
> & { categories: { name: string; slug: string } | null }

export type OnboardingState = {
  provider: OnboardingProviderSnapshot
  progress: Pick<
    ProviderOnboardingProgress,
    'terms_version' | 'terms_accepted_at' | 'privacy_version' | 'privacy_accepted_at' | 'last_seen_at'
  > | null
  readiness: ReadinessResult
  photoCount: number
  packageCount: number
  availabilityCount: number
}

/**
 * Carga todo lo que el hub necesita para pintar el checklist en una sola pasada.
 * El conteo de fotos sale de `provider_media` (la fuente real) y no del arreglo
 * `providers.photos`, que es solo un espejo desnormalizado.
 */
export async function loadOnboardingState(
  supabase: Supabase,
  userId: string
): Promise<OnboardingState | null> {
  const { data: provider } = await supabase
    .from('providers')
    .select(
      'id, name, slug, status, category_id, zona, phone, description, event_types, photos, instagram_handle, categories(name, slug)'
    )
    .eq('claimed_by', userId)
    .maybeSingle()

  if (!provider) return null

  const typedProvider = provider as unknown as OnboardingProviderSnapshot

  const [{ data: progress }, { count: photoCount }, { count: packageCount }, { count: availabilityCount }] =
    await Promise.all([
      supabase
        .from('provider_onboarding_progress')
        .select('terms_version, terms_accepted_at, privacy_version, privacy_accepted_at, last_seen_at')
        .eq('provider_id', typedProvider.id)
        .maybeSingle(),
      supabase
        .from('provider_media')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', typedProvider.id)
        .eq('type', 'photo'),
      supabase
        .from('service_packages')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', typedProvider.id),
      supabase
        .from('provider_availability')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', typedProvider.id),
    ])

  const readiness = getProviderReadiness({
    name: typedProvider.name,
    category_id: typedProvider.category_id,
    zona: typedProvider.zona,
    phone: typedProvider.phone,
    description: typedProvider.description,
    event_types: typedProvider.event_types as EventType[] | null,
    photos: typedProvider.photos,
    photoCount: photoCount ?? 0,
    termsAcceptedVersion: progress?.terms_version ?? null,
    privacyAcceptedVersion: progress?.privacy_version ?? null,
  })

  return {
    provider: typedProvider,
    progress: progress ?? null,
    readiness,
    photoCount: photoCount ?? 0,
    packageCount: packageCount ?? 0,
    availabilityCount: availabilityCount ?? 0,
  }
}
