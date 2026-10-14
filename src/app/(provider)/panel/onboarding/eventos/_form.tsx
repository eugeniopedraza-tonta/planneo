'use client'

import { useActionState, useState } from 'react'
import { saveEventTypes, type State } from '../_actions'
import { EVENT_TYPES } from '@/lib/constants'
import type { EventType } from '@/lib/types'

export default function EventTypesForm({ selected }: { selected: EventType[] }) {
  const [state, formAction, isPending] = useActionState(saveEventTypes, {} as State)
  const [chosen, setChosen] = useState<EventType[]>(selected)

  const toggle = (value: EventType) => {
    setChosen((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EVENT_TYPES.map((type) => {
          const active = chosen.includes(type.value)
          return (
            <label
              key={type.value}
              className={`cursor-pointer rounded-xl border px-3 py-4 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-planneo-300 ${
                active
                  ? 'border-planneo-300 bg-planneo-600/20 text-white'
                  : 'border-input bg-white/[0.04] text-white/70 hover:border-white/60'
              }`}
            >
              <input
                type="checkbox"
                name="event_types"
                value={type.value}
                checked={active}
                onChange={() => toggle(type.value)}
                className="sr-only"
              />
              {type.label}
            </label>
          )
        })}
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending || chosen.length === 0}
          className="rounded-xl bg-planneo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
