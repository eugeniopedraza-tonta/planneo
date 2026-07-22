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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="v4-mono text-[10px] text-planneo-300">PAQUETES</p>
          <h2 className="v4-display mt-1 text-2xl font-bold tracking-[-0.04em] text-white">
            Paquetes y precios
          </h2>
        </div>
        {eventDate && (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              blocked
                ? 'border-red-400/30 bg-red-400/10 text-red-300'
                : dateStatus === 'available'
                  ? 'border-planneo-mint/30 bg-planneo-mint/10 text-planneo-mint'
                  : 'border-amber-300/30 bg-amber-300/10 text-amber-200'
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
              className={`rounded-2xl border p-5 transition ${
                pkg.is_featured
                  ? 'border-planneo-gold/30 bg-planneo-gold/[0.06]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="v4-display text-lg font-bold tracking-[-0.02em] text-white">{pkg.name}</h3>
                    {pkg.is_featured && (
                      <span className="v4-mono inline-flex items-center gap-1 rounded-full border border-planneo-gold/40 bg-planneo-gold/10 px-2.5 py-0.5 text-[9px] text-planneo-gold">
                        <svg className="size-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2l2.9 6.26L21.5 9.27l-5 4.87 1.18 6.88L12 17.77l-5.68 3.25L7.5 14.14l-5-4.87 6.6-1.01L12 2z" />
                        </svg>
                        Destacado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-planneo-mint">
                    {formatPackagePrice(pkg)}
                  </p>
                  {pkg.description && (
                    <p className="mt-2 text-sm leading-6 text-white/55">{pkg.description}</p>
                  )}
                  {(pkg.includes?.length ?? 0) > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {pkg.includes!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <svg className="mt-1 size-3.5 shrink-0 text-planneo-mint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
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
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[14px] border border-planneo-mint/40 bg-planneo-mint/10 px-4 text-sm font-semibold text-planneo-mint transition hover:bg-planneo-mint/20"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      En tu evento — quitar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => handleAdd(pkg)}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-[14px] bg-planneo-600 px-5 text-sm font-semibold text-white transition hover:bg-planneo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
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
