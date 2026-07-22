'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  readCart,
  removeCartItem,
  subscribeToCart,
  type Cart,
} from '@/lib/cart'
import { EVENT_TYPES } from '@/lib/constants'

const EVENT_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map(({ value, label }) => [value, label])
)

function formatMXN(n: number) {
  return `$${n.toLocaleString('es-MX')}`
}

/** Suma de rangos de precio del carrito; null si ningún paquete publica precio. */
function estimateRange(cart: Cart): { from: number; to: number } | null {
  let from = 0
  let to = 0
  let priced = false
  for (const item of cart.items) {
    if (item.priceFrom == null && item.priceTo == null) continue
    priced = true
    from += item.priceFrom ?? item.priceTo ?? 0
    to += item.priceTo ?? item.priceFrom ?? 0
  }
  return priced ? { from, to } : null
}

/**
 * "Mi evento" — el carrito de la fase carrito. Botón con contador en la
 * navbar + drawer de vidrio con los paquetes agregados. El envío al servidor
 * llega en el sprint de checkout; aquí solo se arma y edita el plan.
 */
export default function EventCart() {
  const [cart, setCart] = useState<Cart>({ event: null, items: [] })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setCart(readCart())
    return subscribeToCart(() => setCart(readCart()))
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const count = cart.items.length
  const estimate = estimateRange(cart)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
        aria-label={`Mi evento, ${count} servicio${count === 1 ? '' : 's'} agregado${count === 1 ? '' : 's'}`}
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2v4M16 2v4M3 10h18" />
          <rect x="3" y="4" width="18" height="18" rx="3" />
        </svg>
        Mi evento
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-planneo-mint text-[11px] font-bold text-planneo-950">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Mi evento">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-sm"
          />
          <aside className="absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-white/10 bg-planneo-900 text-planneo-ink shadow-[0_0_80px_rgba(0,0,0,0.7)]">
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="v4-mono text-[10px] text-planneo-300">TU PLAN</p>
                <h2 className="v4-display mt-1 text-2xl font-bold tracking-[-0.04em]">Mi evento</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11 cursor-pointer rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar mi evento"
              >
                <svg className="mx-auto size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {cart.event && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
                  <p className="font-semibold text-white">
                    {EVENT_LABEL[cart.event.eventType] ?? cart.event.eventType}
                  </p>
                  <p className="mt-1 text-white/60">
                    {cart.event.eventDate}
                    {cart.event.guestCount ? ` · ${cart.event.guestCount} invitados` : ''}
                    {cart.event.eventLocation ? ` · ${cart.event.eventLocation}` : ''}
                  </p>
                </div>
              )}

              {count === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
                  <p className="v4-display text-2xl font-bold tracking-[-0.04em]">Tu evento está vacío.</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/55">
                    Agrega paquetes de foto, música, salón o catering desde los perfiles y arma tu plan aquí.
                  </p>
                  <Link
                    href="/proveedores"
                    onClick={() => setOpen(false)}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-planneo-600 px-6 text-sm font-semibold text-white transition hover:bg-planneo-500"
                  >
                    Explorar proveedores
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.items.map((item) => (
                    <li key={item.packageId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/${item.categorySlug}/${item.providerSlug}`}
                            onClick={() => setOpen(false)}
                            className="text-sm font-semibold text-white transition hover:text-planneo-300"
                          >
                            {item.providerName}
                          </Link>
                          <p className="mt-0.5 truncate text-sm text-white/60">{item.packageName}</p>
                          <p className="mt-1 text-sm font-medium text-planneo-mint">
                            {item.priceFrom == null && item.priceTo == null
                              ? 'Precio a consultar'
                              : item.priceFrom != null && item.priceTo != null
                                ? `${formatMXN(item.priceFrom)} – ${formatMXN(item.priceTo)}`
                                : `Desde ${formatMXN(item.priceFrom ?? item.priceTo ?? 0)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.packageId)}
                          className="min-h-11 min-w-11 shrink-0 cursor-pointer rounded-xl p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                          aria-label={`Quitar ${item.packageName} de mi evento`}
                        >
                          <svg className="mx-auto size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {count > 0 && (
              <footer className="border-t border-white/10 p-5">
                {estimate && (
                  <div className="mb-4 flex items-baseline justify-between text-sm">
                    <span className="text-white/55">Estimado ({count} servicio{count === 1 ? '' : 's'})</span>
                    <span className="v4-display text-lg font-bold text-white">
                      {estimate.from === estimate.to
                        ? formatMXN(estimate.from)
                        : `${formatMXN(estimate.from)} – ${formatMXN(estimate.to)}`}
                    </span>
                  </div>
                )}
                <Link
                  href="/proveedores"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-[14px] bg-planneo-600 font-semibold text-white transition hover:bg-planneo-500"
                >
                  Agregar más servicios
                </Link>
                <p className="mt-3 text-center text-[11px] leading-5 text-white/50">
                  Al terminar, desde aquí enviarás tu solicitud de cotización a todos los proveedores de tu plan.
                </p>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
