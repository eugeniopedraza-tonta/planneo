'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatPackagePrice } from '@/lib/format'
import {
  addCartItem,
  readCart,
  removeCartItem,
  subscribeToCart,
  type Cart,
} from '@/lib/cart'
import type { PublicAvailability, ServicePackage } from '@/lib/types'

type Props = {
  provider: { id: string; name: string; slug: string; categorySlug: string }
  packages: ServicePackage[]
  availability: PublicAvailability[]
}

/**
 * Paquetes del proveedor con "Agregar a mi evento". Regla de disponibilidad:
 * solo un día marcado 'booked' en la fecha del evento bloquea; sin marcar o
 * 'tentative' se permite con etiqueta "Por confirmar".
 */
export default function ProviderPackagesSection({ provider, packages, availability }: Props) {
  const [cart, setCart] = useState<Cart>({ event: null, items: [] })

  useEffect(() => {
    setCart(readCart())
    return subscribeToCart(() => setCart(readCart()))
  }, [])

  if (packages.length === 0) return null

  const eventDate = cart.event?.eventDate ?? null
  const dateStatus = eventDate
    ? availability.find((a) => a.date === eventDate)?.status ?? null
    : null
  const blocked = dateStatus === 'booked'

  function handleAdd(pkg: ServicePackage) {
    addCartItem({
      providerId: provider.id,
      providerName: provider.name,
      providerSlug: provider.slug,
      categorySlug: provider.categorySlug,
      packageId: pkg.id,
      packageName: pkg.name,
      priceFrom: pkg.price_from,
      priceTo: pkg.price_to,
    })
    toast.success(`"${pkg.name}" agregado a tu evento.`)
  }

  function handleRemove(pkg: ServicePackage) {
    removeCartItem(pkg.id)
    toast.success(`"${pkg.name}" quitado de tu evento.`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-semibold text-[#111827]">Paquetes y precios</h2>
        {eventDate && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              blocked
                ? 'bg-red-50 text-red-600'
                : dateStatus === 'available'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {blocked
              ? 'No disponible en tu fecha'
              : dateStatus === 'available'
                ? 'Disponible en tu fecha'
                : 'Disponibilidad por confirmar'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {packages.map((pkg) => {
          const inCart = cart.items.some((i) => i.packageId === pkg.id)
          return (
            <div
              key={pkg.id}
              className={`rounded-xl border p-4 ${
                pkg.is_featured ? 'border-[#7C3AED]/40 bg-purple-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[#111827]">{pkg.name}</h3>
                    {pkg.is_featured && (
                      <span className="text-[11px] font-medium bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full">
                        Destacado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#7C3AED] font-medium mt-0.5">
                    {formatPackagePrice(pkg)}
                  </p>
                  {pkg.description && (
                    <p className="text-sm text-[#6B7280] mt-1.5">{pkg.description}</p>
                  )}
                  {(pkg.includes?.length ?? 0) > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {pkg.includes!.map((item, i) => (
                        <li key={i} className="text-xs text-[#374151] flex items-start gap-1.5">
                          <span className="text-[#7C3AED] mt-px" aria-hidden="true">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="shrink-0">
                  {inCart ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(pkg)}
                      className="text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-700 px-3.5 py-2 hover:bg-green-100 transition-colors"
                    >
                      ✓ En tu evento — quitar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => handleAdd(pkg)}
                      className="text-xs font-medium rounded-full bg-[#7C3AED] text-white px-3.5 py-2 hover:bg-[#6D28D9] transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Agregar a mi evento
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
