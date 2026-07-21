'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AVAILABILITY_STATUS_LABELS } from '@/lib/constants'
import type { AvailabilityStatus, ProviderAvailability } from '@/lib/types'
import { setAvailability } from './_actions'

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  booked: 'bg-rose-100 text-rose-800 border-rose-300',
  tentative: 'bg-amber-100 text-amber-800 border-amber-300',
}

const STATUS_DOTS: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  booked: 'bg-rose-500',
  tentative: 'bg-amber-500',
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function AvailabilityCalendar({
  initialAvailability,
}: {
  initialAvailability: ProviderAvailability[]
}) {
  const router = useRouter()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  const byDate = new Map(initialAvailability.map((a) => [a.date, a]))
  const selectedEntry = selected ? byDate.get(selected) : undefined

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  function select(dateKey: string) {
    setSelected(dateKey)
    setNote(byDate.get(dateKey)?.note ?? '')
  }

  function save(status: AvailabilityStatus | 'none') {
    if (!selected) return
    startTransition(async () => {
      const res = await setAvailability({ date: selected, status, note })
      if (res.error) {
        toast.error(res.error)
      } else {
        if (status === 'none') setNote('')
        router.refresh()
      }
    })
  }

  // Lunes como primer día de la semana
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            ←
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            →
          </button>
        </div>

        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-[11px] font-medium text-gray-400 py-1">{d}</span>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = toKey(viewYear, viewMonth, day)
            const entry = byDate.get(key)
            const isSelected = selected === key
            const isToday = key === todayKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                aria-label={`${day} de ${MONTHS[viewMonth]}${entry ? `: ${AVAILABILITY_STATUS_LABELS[entry.status]}` : ''}`}
                aria-pressed={isSelected}
                className={`relative aspect-square rounded-lg border text-sm flex flex-col items-center justify-center transition-colors ${
                  entry
                    ? STATUS_STYLES[entry.status]
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                } ${isSelected ? 'ring-2 ring-[#7C3AED]' : ''} ${isToday && !entry ? 'font-bold text-[#7C3AED]' : ''}`}
              >
                {day}
                {entry?.note && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-current opacity-60" aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
          {(Object.keys(STATUS_DOTS) as AvailabilityStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`size-2 rounded-full ${STATUS_DOTS[s]}`} aria-hidden />
              {AVAILABILITY_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Panel del día seleccionado */}
      {selected && (
        <div className="bg-white rounded-2xl border border-[#7C3AED]/30 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {formatSelected(selected)}
            {selectedEntry && (
              <span className="ml-2 text-xs font-medium text-gray-500">
                · {AVAILABILITY_STATUS_LABELS[selectedEntry.status]}
              </span>
            )}
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {(['available', 'booked', 'tentative'] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={() => save(s)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
                  selectedEntry?.status === s
                    ? STATUS_STYLES[s]
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {AVAILABILITY_STATUS_LABELS[s]}
              </button>
            ))}
            {selectedEntry && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => save('none')}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
              >
                Quitar marca
              </button>
            )}
          </div>

          <label htmlFor="availability-note" className="text-xs font-medium text-gray-500">
            Nota privada (opcional)
          </label>
          <div className="flex gap-2 mt-1">
            <input
              id="availability-note"
              type="text"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. boda García, anticipo recibido…"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
            {selectedEntry && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => save(selectedEntry.status)}
                className="px-3 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6B2FD6] disabled:opacity-50"
              >
                Guardar nota
              </button>
            )}
          </div>
          {!selectedEntry && (
            <p className="text-xs text-gray-400 mt-1.5">
              La nota se guarda al elegir un estado para el día.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function formatSelected(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]} de ${y}`
}
