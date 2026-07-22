import { PRICE_UNITS } from '@/lib/constants'
import type { ServicePackage } from '@/lib/types'

/** YYYY-MM-DD en hora LOCAL (toISOString daría el día UTC, que en MX se
 *  adelanta desde las ~6pm). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "$8,000 – $12,000 por evento" | "Desde $8,000" | "Precio a consultar" */
export function formatPackagePrice(pkg: Pick<ServicePackage, 'price_from' | 'price_to' | 'price_unit'>): string {
  const unit = PRICE_UNITS.find((u) => u.value === pkg.price_unit)?.label.toLowerCase() ?? ''
  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`
  if (pkg.price_from && pkg.price_to) return `${fmt(pkg.price_from)} – ${fmt(pkg.price_to)} ${unit}`.trim()
  if (pkg.price_from) return `Desde ${fmt(pkg.price_from)} ${unit}`.trim()
  return 'Precio a consultar'
}
