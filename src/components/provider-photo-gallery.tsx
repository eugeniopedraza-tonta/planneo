'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  name: string
  photos: string[]
}

/**
 * Galería estilo Airbnb: hero + hasta 4 miniaturas en desktop, carrusel con
 * scroll-snap en móvil y lightbox con todas las fotos. La cuadrícula se adapta
 * a 1, 2, 3-4 o 5+ fotos sin dejar huecos.
 */
export default function ProviderPhotoGallery({ name, photos }: Props) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (photos.length === 0) return null

  const tiles = photos.slice(1, 5)

  // Con 1-3 miniaturas ensanchamos algunas para que la cuadrícula quede llena.
  function tileClass(i: number) {
    if (tiles.length === 1) return 'col-span-2 row-span-2'
    if (tiles.length === 2) return 'col-span-2'
    if (tiles.length === 3 && i === 0) return 'col-span-2'
    return ''
  }

  const showAllButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="absolute bottom-3 right-3 z-10 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-planneo-950/80 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-planneo-950"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      Ver las {photos.length} fotos
    </button>
  )

  return (
    <>
      {/* Móvil: carrusel con scroll-snap */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 sm:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto" aria-label={`Fotos de ${name}`}>
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(true)}
              className="relative h-72 w-full shrink-0 cursor-pointer snap-center bg-white/[0.04]"
              aria-label={`Ver foto ${i + 1} de ${photos.length} en pantalla completa`}
            >
              <Image
                src={photo}
                alt={`${name} foto ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-planneo-950/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {photos.length} fotos
          </span>
        )}
      </div>

      {/* Desktop: cuadrícula hero + miniaturas */}
      <div className="relative hidden sm:block">
        {photos.length === 1 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative block h-[420px] w-full cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
            aria-label="Ver foto en pantalla completa"
          >
            <Image
              src={photos[0]}
              alt={`${name} foto principal`}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover transition duration-300 hover:brightness-110"
              priority
            />
          </button>
        ) : photos.length === 2 ? (
          <div className="grid h-[360px] grid-cols-2 gap-2 overflow-hidden rounded-3xl border border-white/10">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(true)}
                className="relative cursor-pointer bg-white/[0.04]"
                aria-label={`Ver foto ${i + 1} en pantalla completa`}
              >
                <Image
                  src={photo}
                  alt={`${name} foto ${i + 1}`}
                  fill
                  sizes="(max-width: 1152px) 50vw, 576px"
                  className="object-cover transition duration-300 hover:brightness-110"
                  priority={i === 0}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl border border-white/10">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative col-span-2 row-span-2 cursor-pointer bg-white/[0.04]"
              aria-label="Ver foto principal en pantalla completa"
            >
              <Image
                src={photos[0]}
                alt={`${name} foto principal`}
                fill
                sizes="(max-width: 1152px) 50vw, 576px"
                className="object-cover transition duration-300 hover:brightness-110"
                priority
              />
            </button>
            {tiles.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(true)}
                className={`relative cursor-pointer bg-white/[0.04] ${tileClass(i)}`}
                aria-label={`Ver foto ${i + 2} en pantalla completa`}
              >
                <Image
                  src={photo}
                  alt={`${name} foto ${i + 2}`}
                  fill
                  sizes="(max-width: 1152px) 25vw, 288px"
                  className="object-cover transition duration-300 hover:brightness-110"
                />
              </button>
            ))}
          </div>
        )}
        {photos.length > 1 && showAllButton}
      </div>

      {/* Lightbox con todas las fotos */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Todas las fotos de ${name}`}
          className="fixed inset-0 z-[70] overflow-y-auto bg-planneo-950/95 backdrop-blur-xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-planneo-950/80 px-4 py-3 backdrop-blur sm:px-6">
            <p className="text-sm font-semibold text-white">
              {name} · {photos.length} fotos
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition hover:bg-white/[0.12]"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              Cerrar
            </button>
          </div>
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/[0.04]">
                <Image
                  src={photo}
                  alt={`${name} foto ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
