/** Mensaje prellenado al abrir el chat desde un perfil. */
export const WHATSAPP_GREETING =
  'Hola, vi tu perfil en Planneo y me interesa cotizar tus servicios.'

/**
 * Dígitos para wa.me: solo números, con lada 52 de México.
 * 10 dígitos → se antepone 52; si ya trae 52 (12 dígitos) no se duplica.
 * El antiguo prefijo móvil 521 se normaliza a 52.
 */
export function toWhatsAppDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 13 && digits.startsWith('521')) digits = `52${digits.slice(3)}`
  if (digits.length === 10) return `52${digits}`
  if (digits.length === 12 && digits.startsWith('52')) return digits
  return null
}

/** Enlace wa.me con el saludo de Planneo, o null si el número no es válido. */
export function whatsAppUrl(phone: string): string | null {
  const digits = toWhatsAppDigits(phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_GREETING)}`
}
