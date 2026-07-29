import type { EventType, ProviderStatus } from '@/lib/types'

export const ZONAS_MTY = [
  'San Pedro Garza García',
  'San Nicolás de los Garza',
  'Guadalupe',
  'Apodaca',
  'Escobedo',
  'Santa Catarina',
  'Juárez',
  'Monterrey Centro',
  'Monterrey Sur',
  'Monterrey Norte',
  'García',
  'Salinas Victoria',
] as const

/** Zona comodín para quien atiende toda el área metropolitana. */
export const ZONA_TODA_EL_AREA = 'Toda el área metropolitana'

/** Opciones de zona ofrecidas en el onboarding (municipios + comodín). */
export const ZONA_OPTIONS = [ZONA_TODA_EL_AREA, ...ZONAS_MTY] as const

export const EVENT_TYPES = [
  { value: 'bodas', label: 'Bodas' },
  { value: 'xv', label: 'XV Años' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'graduacion', label: 'Graduación' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'bautizo', label: 'Bautizos y familiares' },
  { value: 'otro', label: 'Otro' },
] as const

/** Valores de `EventType`, para construir esquemas zod sin repetir la lista. */
export const EVENT_TYPE_VALUES = EVENT_TYPES.map((e) => e.value) as unknown as [
  EventType,
  ...EventType[],
]

/** Etiqueta por valor. Evita mapas de labels duplicados que muestran el slug crudo. */
export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map((e) => [e.value, e.label])
) as Record<EventType, string>

export const PRICE_RANGES = [
  { value: '$', label: '$ · Económico' },
  { value: '$$', label: '$$ · Intermedio' },
  { value: '$$$', label: '$$$ · Premium' },
] as const

export const CATEGORY_SLUGS = [
  'fotografia',
  'belleza',
  'musica',
  'banquete',
  'decoracion',
  'salones',
] as const

/** Etiquetas para admin. Tipado exhaustivo: agregar un estado sin etiqueta no compila. */
export const STATUS_LABELS: Record<ProviderStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  paused: 'Pausado',
  rejected: 'Necesita cambios',
}

/** Copy que ve el proveedor en su propio panel (más explicativo que el de admin). */
export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  draft: 'Borrador — solo tú puedes verlo',
  pending_review: 'En revisión',
  published: 'Activo',
  paused: 'Pausado — no aparece al público',
  rejected: 'Necesita cambios',
}

export const STATUS_STYLES: Record<ProviderStatus, string> = {
  draft: 'bg-white/10 text-white/70',
  pending_review: 'bg-amber-300/15 text-amber-200',
  published: 'bg-planneo-mint/15 text-planneo-mint',
  paused: 'bg-white/10 text-white/55',
  rejected: 'bg-red-400/15 text-red-300',
}

/**
 * Versiones de los documentos legales. Se guardan junto a la aceptación: sin
 * versión, un `terms_accepted_at` no dice qué fue lo que se aceptó.
 */
export const TERMS_VERSION = '2026-07-28'
export const PRIVACY_VERSION = '2026-07-28'

/** Longitud mínima de descripción para poder publicar. */
export const MIN_DESCRIPTION_LENGTH = 80

export const PRICE_UNITS = [
  { value: 'por_evento', label: 'Por evento' },
  { value: 'por_hora', label: 'Por hora' },
  { value: 'por_persona', label: 'Por persona' },
] as const

export const MENU_COURSES = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'sopa', label: 'Sopa' },
  { value: 'plato_principal', label: 'Plato principal' },
  { value: 'postre', label: 'Postre' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'extras', label: 'Extras' },
] as const

export const VENUE_AMENITIES = [
  'Audio y sonido',
  'Iluminación',
  'Proyector / pantalla',
  'Terraza',
  'Jardín',
  'Alberca',
  'Aire acondicionado',
  'Calefacción',
  'Cocina equipada',
  'Barra de bebidas',
  'Valet parking',
  'Acceso para discapacitados',
] as const

export const AVAILABILITY_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  booked: 'Reservado',
  tentative: 'Tentativo',
}

/** Paleta compartida de disponibilidad (calendario público, badges de paquetes). */
export const AVAILABILITY_STATUS_STYLE = {
  available: 'bg-planneo-mint/15 text-planneo-mint',
  booked: 'bg-red-400/15 text-red-300',
  tentative: 'bg-amber-300/15 text-amber-200',
} as const satisfies Record<string, string>

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  new: 'Nueva',
  read: 'Leída',
  replied: 'Respondida',
  confirmed: 'Confirmada',
  closed: 'Cerrada',
}

export const VENUE_CATEGORY_SLUG = 'salones'
export const CATERING_CATEGORY_SLUG = 'banquete'
