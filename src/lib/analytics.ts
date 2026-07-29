declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Evento de GA4 desde el cliente. Nunca se mandan email, teléfono, tokens ni
 * nombres: solo dimensiones agregables (categoría, punto de entrada, duración).
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

/** Id de sesión anónimo compartido por el tracking de leads. */
export function getOrCreateSessionId(): string {
  const KEY = 'planneo_session'
  try {
    const existing = sessionStorage.getItem(KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    sessionStorage.setItem(KEY, id)
    return id
  } catch {
    // Safari en modo privado puede rechazar sessionStorage.
    return 'anon'
  }
}

/** Cubeta de tamaño de archivo, para reportar fallos de carga sin exponer el archivo. */
export function fileSizeBucket(bytes: number): string {
  if (bytes < 1_000_000) return '<1MB'
  if (bytes < 5_000_000) return '1-5MB'
  if (bytes < 10_000_000) return '5-10MB'
  return '>10MB'
}
