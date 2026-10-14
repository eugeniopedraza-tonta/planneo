/** Correo general de Planneo (el mismo que usan reclamos y registros). */
export const PLANNEO_EMAIL = 'hola@planneo.mx'

/**
 * WhatsApp de Planneo para los estados vacíos del catálogo.
 * `NEXT_PUBLIC_PLANNEO_WHATSAPP`: 10 dígitos MX o con lada (52…). Sin valor,
 * los CTAs caen a correo.
 */
function planneoWhatsAppDigits(): string | null {
  const digits = (process.env.NEXT_PUBLIC_PLANNEO_WHATSAPP ?? '').replace(/\D/g, '')
  if (!digits) return null
  return digits.length === 10 ? `52${digits}` : digits
}

/** Liga para escribirle a Planneo: wa.me si hay número, si no `mailto:`. */
export function planneoContactHref(message: string): { href: string; channel: 'whatsapp' | 'email' } {
  const digits = planneoWhatsAppDigits()
  if (digits) {
    return { href: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`, channel: 'whatsapp' }
  }
  return {
    href: `mailto:${PLANNEO_EMAIL}?subject=${encodeURIComponent('Busco proveedor en Planneo')}&body=${encodeURIComponent(message)}`,
    channel: 'email',
  }
}
