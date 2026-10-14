const ORIGIN = 'http://planneo.local'

/**
 * Solo rutas internas: "/panel" sí; "//evil.com", "/\evil.com", URLs
 * absolutas o rutas con espacios/caracteres de control ("/\t/evil.com", que
 * el navegador convierte en "//evil.com") no, para que `?next=` no sirva como
 * redirección abierta. Tampoco /login, para no rebotar en un ciclo.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  if (/[\u0000- \u007f\\]/.test(value)) return null
  try {
    const url = new URL(value, ORIGIN)
    if (url.origin !== ORIGIN || url.pathname.startsWith('/login')) return null
  } catch {
    return null
  }
  return value
}
