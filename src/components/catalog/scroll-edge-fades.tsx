'use client'

/**
 * Desvanecidos laterales de un carril horizontal (decorativos). El derecho
 * lleva una flecha para que se lea "hay más". `fromClass` es el color del
 * fondo detrás del carril (clase Tailwind estática, p. ej. `from-planneo-900`).
 */
export default function ScrollEdgeFades({
  start,
  end,
  fromClass,
}: {
  start: boolean
  end: boolean
  fromClass: string
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r ${fromClass} to-transparent transition-opacity duration-200 ${
          start ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden="true"
        data-scroll-fade-end={end ? 'visible' : 'hidden'}
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 items-center justify-end bg-gradient-to-l ${fromClass} from-35% to-transparent transition-opacity duration-200 ${
          end ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          className="mr-0.5 size-4 text-white/60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </div>
    </>
  )
}
