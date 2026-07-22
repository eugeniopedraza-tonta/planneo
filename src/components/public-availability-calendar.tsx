'use client'

import { useEffect, useState } from 'react'
import type { PublicAvailability } from '@/lib/types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** Estados sobre fondo oscuro; los de constants son para el panel (claro). */
const STATUS_STYLE: Record<string, string> = {
  available: 'bg-planneo-mint/20 text-planneo-mint font-semibold',
  booked: 'bg-red-400/15 text-red-300 font-semibold',
  tentative: 'bg-amber-300/15 text-amber-200 font-semibold',
}

/** Calendario readonly del perfil público. Sin notas — solo fecha y estado. */
export default function PublicAvailabilityCalendar({
  availability,
}: {
  availability: PublicAvailability[]
}) {
  // "Hoy" solo existe tras montar: el HTML viene de un prerender ISR de hasta
  // una hora antes y usar new Date() en el render causaría mismatch de hidratación.
  const [today, setToday] = useState<Date | null>(null)
  const [year, setYear] = useState(0)
  const [month, setMonth] = useState(0)

  useEffect(() => {
    const now = new Date()
    setToday(now)
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }, [])

  const byDate = new Map(availability.map((a) => [a.date, a.status]))

  if (!today) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
        <p className="v4-mono text-[10px] text-planneo-300">AGENDA</p>
        <h2 className="v4-display mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Disponibilidad</h2>
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white/[0.05]" />
      </div>
    )
  }

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Lunes primero: getDay() da 0=domingo
  const leadingBlanks = (firstDay.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
      <p className="v4-mono text-[10px] text-planneo-300">AGENDA</p>
      <h2 className="v4-display mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Disponibilidad</h2>
      <p className="mb-4 mt-2 text-xs text-white/50">
        Los días sin marcar están por confirmar con el proveedor.
      </p>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={atCurrentMonth}
          className="min-h-11 min-w-11 cursor-pointer rounded-xl px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <svg className="mx-auto size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-white">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="min-h-11 min-w-11 cursor-pointer rounded-xl px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Mes siguiente"
        >
          <svg className="mx-auto size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="v4-mono py-1 text-[9px] text-white/50">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b-${i}`} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const status = byDate.get(iso)
          const isPast =
            new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          return (
            <div
              key={iso}
              className={`rounded-lg py-1.5 text-xs ${
                isPast
                  ? 'text-white/20'
                  : status
                    ? STATUS_STYLE[status]
                    : 'text-white/70'
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-planneo-mint" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-red-400" /> Reservado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-amber-300" /> Tentativo
        </span>
      </div>
    </div>
  )
}
