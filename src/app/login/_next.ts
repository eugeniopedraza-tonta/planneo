/**
 * Solo rutas internas: "/panel" sí; "//evil.com", "/\evil.com" o URLs
 * absolutas no, para que `?next=` no sirva como redirección abierta.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
