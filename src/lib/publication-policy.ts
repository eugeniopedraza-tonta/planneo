import type { ProviderStatus } from '@/lib/types'

export type PublicationPolicy = 'manual_review' | 'auto_publish'

/**
 * Decisión de negocio, no de interfaz: la pantalla final soporta las dos y solo
 * cambia el copy. Por defecto se revisa a mano, que es como opera Planneo hoy.
 */
export function getPublicationPolicy(): PublicationPolicy {
  return process.env.PROVIDER_PUBLICATION_POLICY === 'auto_publish'
    ? 'auto_publish'
    : 'manual_review'
}

/** Estado al que pasa un perfil que ya cumple todas las reglas de publicación. */
export function statusAfterPublicationRequest(): ProviderStatus {
  return getPublicationPolicy() === 'auto_publish' ? 'published' : 'pending_review'
}
