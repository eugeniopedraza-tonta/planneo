'use client'

import { useState } from 'react'
import type { PublicAvailability } from '@/lib/types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  booked: 'bg-red-100 text-red-700',
  tentative: 'bg-amber-100 text-amber-800',
}

/** Calendario readonly del perfil público. Sin notas — solo fecha y estado. */
export default function PublicAvailabilityCalendar({
  availability,
}: {
  availability: PublicAvailability[]
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const byDate = new Map(availability.map((a) => [a.date, a.status]))

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-[#111827] mb-1">Disponibilidad</h2>
      <p className="text-xs text-[#6B7280] mb-4">
        Los días sin marcar están por confirmar con el proveedor.
      </p>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={atCurrentMonth}
          className="text-sm text-[#6B7280] hover:text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <p className="text-sm font-medium text-[#111827]">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="text-sm text-[#6B7280] hover:text-[#7C3AED] px-2 py-1"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-[11px] font-medium text-[#9CA3AF] py-1">
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
              className={`text-xs rounded-lg py-1.5 ${
                isPast
                  ? 'text-gray-300'
                  : status
                    ? STATUS_STYLE[status]
                    : 'text-[#374151]'
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-[#6B7280]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-300 inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" /> Reservado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block" /> Tentativo
        </span>
      </div>
    </div>
  )
}
