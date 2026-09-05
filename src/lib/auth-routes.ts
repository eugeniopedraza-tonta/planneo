import { isOrganizerAccountsEnabled } from '@/lib/feature-flags'

/**
 * Roles que pueden entrar al panel de proveedor.
 *
 * El estado del perfil dejó de vivir en el rol y ahora vive en
 * `providers.status`: todo dueño de un perfil es simplemente `provider`. Los
 * roles viejos se siguen aceptando porque el rol viaja en el JWT y las sesiones
 * ya emitidas conservan el valor anterior hasta que el token expira.
 *
 * `provider_rejected` se acepta a propósito: quien fue rechazado necesita
 * entrar justamente para corregir su perfil.
 */
export const PROVIDER_PANEL_ROLES = [
  'provider',
  'provider_pending',
  'provider_rejected',
  'admin',
] as const

export function canAccessProviderPanel(role: unknown): boolean {
  return (PROVIDER_PANEL_ROLES as readonly unknown[]).includes(role)
}

/** Destino tras iniciar sesión según el rol. */
export function homeForRole(role: unknown): string {
  if (role === 'admin') return '/admin'
  if (canAccessProviderPanel(role)) return '/panel'
  if (isOrganizerAccountsEnabled()) return '/mis-consultas'
  return '/'
}
