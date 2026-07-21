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

export const EVENT_TYPES = [
  { value: 'bodas', label: 'Bodas' },
  { value: 'xv', label: 'XV Años' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'graduacion', label: 'Graduación' },
] as const

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

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  published: 'Publicado',
  claimed: 'Reclamado',
}

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

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  new: 'Nueva',
  read: 'Leída',
  replied: 'Respondida',
  confirmed: 'Confirmada',
  closed: 'Cerrada',
}

export const VENUE_CATEGORY_SLUG = 'salones'
export const CATERING_CATEGORY_SLUG = 'banquete'
