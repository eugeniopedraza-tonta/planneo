/**
 * Interruptores de producto, no de interfaz: el código de Fase 2 se queda,
 * pero por defecto está apagado. Cualquier valor distinto de `on` es OFF
 * (incluido unset). Prefijo NEXT_PUBLIC_ para que también existan en cliente.
 *
 * Cómo reactivar más adelante (local o Vercel):
 *   NEXT_PUBLIC_FEATURE_CART=on
 *   NEXT_PUBLIC_FEATURE_INQUIRIES=on
 *   NEXT_PUBLIC_FEATURE_ORGANIZER_ACCOUNTS=on
 *   NEXT_PUBLIC_FEATURE_WHATSAPP_WALL=on
 *   NEXT_PUBLIC_FEATURE_REVIEWS=on
 */
function isOn(value: string | undefined): boolean {
  return value === 'on'
}

/** UI del carrito de evento ("Agregar a mi evento", EventCart). */
export function isCartEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_CART)
}

/** Formulario público de cotización y altas nuevas de inquiries. */
export function isInquiriesEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_INQUIRIES)
}

/** Cuentas de organizador: /crear-cuenta, /mis-consultas y sus enlaces. */
export function isOrganizerAccountsEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_ORGANIZER_ACCOUNTS)
}

/**
 * Muro de login para ver WhatsApp. En el MVP debe quedarse OFF:
 * el celular es público y el CTA abre wa.me sin cuenta.
 */
export function isWhatsappWallEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_WHATSAPP_WALL)
}

/** Reseñas con estrellas. No implementadas; el flag existe para no construirlas. */
export function isReviewsEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_REVIEWS)
}

/**
 * Asistente "Crear mi evento" (tipo de evento → detalles → servicios) y sus
 * enlaces en home, nav y footer. Fase 2: en el MVP el flujo es buscar →
 * perfil → WhatsApp. Reactivar con NEXT_PUBLIC_FEATURE_EVENT_PLANNER=on.
 */
export function isEventPlannerEnabled(): boolean {
  return isOn(process.env.NEXT_PUBLIC_FEATURE_EVENT_PLANNER)
}
