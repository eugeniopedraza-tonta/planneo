import type { CategorySlug } from '@/lib/constants'
import type { CategoryContent } from './types'
import lugares from './lugares'
import banquete from './banquete'
import musica from './musica'
import fotoVideo from './foto-video'
import decoracion from './decoracion'
import mobiliario from './mobiliario'
import belleza from './belleza'
import invitaciones from './invitaciones'
import otros from './otros'

export type { CategoryContent } from './types'

/** Un archivo por categoría madre. Tipado exhaustivo: una madre nueva sin contenido no compila. */
export const CATEGORY_CONTENT: Record<CategorySlug, CategoryContent> = {
  lugares,
  banquete,
  musica,
  'foto-video': fotoVideo,
  decoracion,
  mobiliario,
  belleza,
  invitaciones,
  otros,
}

export function getCategoryContent(slug: CategorySlug): CategoryContent {
  return CATEGORY_CONTENT[slug]
}
