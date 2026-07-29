import { HugeiconsIcon } from '@hugeicons/react'
import {
  BalloonsIcon,
  BlushBrush01Icon,
  Building02Icon,
  Camera01Icon,
  MusicNote01Icon,
  Restaurant01Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons'

/**
 * Icono por categoría de servicio, tomado del set libre de Hugeicons (MIT) que
 * el proyecto ya usa en los componentes de UI.
 *
 * La clave es `categories.slug`: una categoría nueva en la base cae en el
 * genérico en lugar de romper la vista.
 */
const CATEGORY_ICONS = {
  fotografia: Camera01Icon,
  belleza: BlushBrush01Icon,
  musica: MusicNote01Icon,
  banquete: Restaurant01Icon,
  decoracion: BalloonsIcon,
  salones: Building02Icon,
} as const

export default function CategoryIcon({
  slug,
  className,
  strokeWidth = 2,
}: {
  slug?: string | null
  className?: string
  strokeWidth?: number
}) {
  const icon = (slug && CATEGORY_ICONS[slug as keyof typeof CATEGORY_ICONS]) || Store01Icon
  return <HugeiconsIcon icon={icon} className={className} strokeWidth={strokeWidth} />
}
