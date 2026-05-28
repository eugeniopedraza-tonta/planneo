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
] as const

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  claimed: 'Reclamado',
}
