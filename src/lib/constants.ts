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

/** Madres indexables en `planneo.mx/{slug}`. El orden es el del árbol público. */
export const CATEGORY_SLUGS = [
  'lugares',
  'banquete',
  'musica',
  'foto-video',
  'decoracion',
  'mobiliario',
  'belleza',
  'invitaciones',
  'otros',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const CATEGORY_NAMES = {
  lugares: 'Lugares y salones',
  banquete: 'Banquete y bebidas',
  musica: 'Música y entretenimiento',
  'foto-video': 'Foto y video',
  decoracion: 'Decoración y ambientación',
  mobiliario: 'Mobiliario y equipo',
  belleza: 'Belleza e imagen',
  invitaciones: 'Invitaciones y detalles',
  otros: 'Otros servicios',
} as const satisfies Record<CategorySlug, string>

/** Etiquetas de filtro dentro de cada madre. No son rutas. */
export const CATEGORY_SUBCATEGORIES = {
  lugares: [
    'Salones',
    'Jardines',
    'Haciendas',
    'Terrazas y roof gardens',
    'Quintas',
    'Casas de eventos',
  ],
  banquete: [
    'Catering',
    'Taquizas y parrilladas',
    'Pastelería y postres',
    'Mesa de dulces',
    'Barra y bartender',
    'Meseros',
  ],
  musica: [
    'DJ',
    'Grupo versátil',
    'Banda',
    'Mariachi',
    'Solistas (sax, violín)',
    'Shows',
    'Hora loca',
    'Animación infantil',
    'Edecanes',
  ],
  'foto-video': [
    'Fotografía',
    'Video',
    'Cabina de fotos',
    '360',
    'Dron',
    'Same day edit',
  ],
  decoracion: [
    'Floristería',
    'Globos',
    'Backdrops',
    'Letras y números',
    'Mantelería',
    'Iluminación decorativa',
    'Centros de mesa',
  ],
  mobiliario: [
    'Sillas y mesas',
    'Carpas',
    'Pistas de baile',
    'Audio e iluminación técnica',
    'Pantallas',
    'Planta de luz',
    'Climatización',
    'Sanitarios portátiles',
    'Juegos e inflables',
  ],
  belleza: [
    'Maquillaje',
    'Peinado',
    'Uñas',
    'Spa',
    'Vestidos y trajes',
    'Renta de vestuario',
  ],
  invitaciones: [
    'Invitaciones digitales e impresas',
    'Imprenta',
    'Diseño gráfico',
    'Señalética',
    'Recuerdos y souvenirs',
    'Personalizados',
  ],
  otros: [
    'Planeación y coordinación',
    'Protocolo',
    'Transporte y limusinas',
    'Valet parking',
    'Seguridad',
    'Servicio médico',
    'Niñeras',
  ],
} as const satisfies Record<CategorySlug, readonly string[]>

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value)
}

export function getSubcategories(slug: string): readonly string[] {
  return isCategorySlug(slug) ? CATEGORY_SUBCATEGORIES[slug] : []
}

export function isAllowedSubcategory(slug: string, subcategory: string): boolean {
  return getSubcategories(slug).includes(subcategory)
}

export function sortByCategoryTree<T extends { slug: string }>(items: T[]): T[] {
  const order = new Map<string, number>(CATEGORY_SLUGS.map((slug, index) => [slug, index]))
  return [...items].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
}

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

export const VENUE_CATEGORY_SLUG = 'lugares'
export const CATERING_CATEGORY_SLUG = 'banquete'
