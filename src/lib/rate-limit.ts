import { createServiceClient } from '@/lib/supabase/server'

/**
 * Límite por ventana deslizante respaldado en Postgres (`check_rate_limit`).
 * Supabase ya limita por IP, pero todas las llamadas de auth salen del mismo IP
 * del servidor, así que ese límite es global y no sirve para frenar a un
 * atacante concreto: aquí se limita por email/acción.
 *
 * Devuelve `true` si la acción puede continuar.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('check_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  })

  // Ante un fallo de infraestructura se deja pasar: es preferible a dejar
  // fuera a proveedores legítimos por un problema nuestro.
  if (error) return true
  return data !== false
}

/** Normaliza el email para que el límite no se evada con mayúsculas o espacios. */
export function rateLimitKey(action: string, value: string): string {
  return `${action}:${value.trim().toLowerCase()}`
}
