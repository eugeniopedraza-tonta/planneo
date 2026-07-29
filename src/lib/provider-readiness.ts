import { MIN_DESCRIPTION_LENGTH, PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants'
import type { EventType, ProviderStatus, VerificationStatus } from '@/lib/types'

export type ReadinessTask =
  | 'basics'
  | 'media'
  | 'description'
  | 'coverage'
  | 'event_types'
  | 'terms'

export type MissingItem = {
  task: ReadinessTask
  label: string
  /** Por qué le conviene al proveedor, no qué campo falta. */
  reason: string
  href: string
}

export type ReadinessResult = {
  isReady: boolean
  missing: MissingItem[]
  /** Tareas bloqueantes completadas / total, para la barra de progreso. */
  completed: number
  total: number
  percent: number
}

/**
 * Lo que la función necesita saber del perfil. Se recibe como snapshot plano
 * (no como fila de Supabase) para que sea pura y se pueda usar igual en el
 * cliente que en el servidor.
 */
export type ProviderReadinessSnapshot = {
  name: string | null
  category_id: string | null
  zona: string | null
  phone: string | null
  description: string | null
  event_types: EventType[] | null
  photos: string[] | null
  /** Filas reales en provider_media; `photos` es solo un espejo desnormalizado. */
  photoCount?: number
  termsAcceptedVersion?: string | null
  privacyAcceptedVersion?: string | null
}

/**
 * Reglas de publicación centralizadas (spec §6.3). La UI las usa para explicar
 * qué falta y el endpoint de publicación las vuelve a ejecutar: que el botón
 * esté oculto no es una garantía.
 */
export function getProviderReadiness(
  snapshot: ProviderReadinessSnapshot
): ReadinessResult {
  const missing: MissingItem[] = []

  const hasName = (snapshot.name ?? '').trim().length >= 2
  const hasCategory = !!snapshot.category_id
  const hasPhone = (snapshot.phone ?? '').trim().length > 0

  if (!hasName || !hasCategory || !hasPhone) {
    missing.push({
      task: 'basics',
      label: 'Revisar datos básicos',
      reason: 'Es lo primero que ve alguien que busca tu servicio.',
      href: '/panel/perfil',
    })
  }

  if (!(snapshot.zona ?? '').trim()) {
    missing.push({
      task: 'coverage',
      label: 'Indicar dónde atiendes',
      reason: 'Te muestra a quienes hacen su evento en tu zona.',
      href: '/panel/perfil',
    })
  }

  const photoCount = snapshot.photoCount ?? snapshot.photos?.length ?? 0
  if (photoCount < 1) {
    missing.push({
      task: 'media',
      label: 'Agregar una foto o tu logo',
      reason: 'Un perfil sin imagen casi no recibe solicitudes.',
      href: '/panel/fotos',
    })
  }

  if (countMeaningfulChars(snapshot.description) < MIN_DESCRIPTION_LENGTH) {
    missing.push({
      task: 'description',
      label: 'Describir tu servicio',
      reason: 'Una descripción clara ayuda a que te contacten por el servicio correcto.',
      href: '/panel/onboarding/descripcion',
    })
  }

  if (!snapshot.event_types || snapshot.event_types.length === 0) {
    missing.push({
      task: 'event_types',
      label: 'Elegir tipos de evento',
      reason: 'Te conecta con el tipo de celebración que sí atiendes.',
      href: '/panel/onboarding/eventos',
    })
  }

  if (
    snapshot.termsAcceptedVersion !== TERMS_VERSION ||
    snapshot.privacyAcceptedVersion !== PRIVACY_VERSION
  ) {
    missing.push({
      task: 'terms',
      label: 'Aceptar términos y privacidad',
      reason: 'Necesario para publicar tu perfil en Planneo.',
      href: '/panel/onboarding',
    })
  }

  const total = BLOCKING_TASKS.length
  const completed = total - missing.length

  return {
    isReady: missing.length === 0,
    missing,
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  }
}

const BLOCKING_TASKS: ReadinessTask[] = [
  'basics',
  'coverage',
  'media',
  'description',
  'event_types',
  'terms',
]

/**
 * Cuenta caracteres significativos: 80 espacios o "aaaa…" no son una descripción.
 */
function countMeaningfulChars(description: string | null | undefined): number {
  if (!description) return 0
  return description.trim().replace(/\s+/g, ' ').length
}

/** Un perfil pausado o rechazado no cuenta como publicado. */
export function isPubliclyVisible(status: ProviderStatus): boolean {
  return status === 'published'
}

/** El badge "Verificado" es una decisión de Planneo, no un efecto de confirmar el teléfono. */
export function showsVerifiedBadge(verification: VerificationStatus): boolean {
  return verification === 'verified'
}
