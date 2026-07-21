'use client'

import { useActionState, useEffect, useState } from 'react'
import { EVENT_TYPES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { createInquiry, type State } from '@/app/[category]/[slug]/_actions'

const inputCls =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] placeholder:text-gray-400'

export default function QuoteRequestForm({ providerId }: { providerId: string }) {
  const [state, formAction, isPending] = useActionState<State, FormData>(createInquiry, {})
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Con sesión iniciada, prellenamos nombre y email de la cuenta.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setName((prev) => prev || data.user.user_metadata?.name || data.user.user_metadata?.contact_name || '')
      setEmail((prev) => prev || data.user.email || '')
    })
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white hover:bg-[#6B2FD6] transition-colors"
      >
        Solicitar cotización
      </button>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm font-medium text-[#111827]">Solicitar cotización</p>

      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <input type="hidden" name="provider_id" value={providerId} />
      {/* Honeypot anti-spam (invisible para humanos) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div>
        <input
          name="name"
          required
          placeholder="Tu nombre *"
          aria-label="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        {state.fieldErrors?.name && <p className="text-xs text-red-600 mt-1">{state.fieldErrors.name[0]}</p>}
      </div>

      <div>
        <input
          name="email"
          type="email"
          placeholder="Tu email"
          aria-label="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        {state.fieldErrors?.email && <p className="text-xs text-red-600 mt-1">{state.fieldErrors.email[0]}</p>}
      </div>

      <input name="phone" placeholder="Tu teléfono (opcional)" aria-label="Tu teléfono" className={inputCls} />

      <div className="grid grid-cols-2 gap-2">
        <select name="event_type" aria-label="Tipo de evento" defaultValue="" className={inputCls}>
          <option value="">Tipo de evento</option>
          {EVENT_TYPES.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <input
          name="guest_count"
          type="number"
          min="1"
          placeholder="Invitados"
          aria-label="Número de invitados"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="inquiry-date" className="text-xs text-gray-500">Fecha del evento (opcional)</label>
        <input id="inquiry-date" name="event_date" type="date" className={inputCls} />
      </div>

      <input
        name="event_location"
        placeholder="Lugar del evento (salón, dirección o zona)"
        aria-label="Lugar del evento"
        maxLength={300}
        className={inputCls}
      />

      <div>
        <textarea
          name="message"
          required
          rows={3}
          placeholder="Cuéntanos sobre tu evento: qué necesitas, dónde será… *"
          aria-label="Mensaje"
          className={inputCls}
        />
        {state.fieldErrors?.message && <p className="text-xs text-red-600 mt-1">{state.fieldErrors.message[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white hover:bg-[#6B2FD6] transition-colors disabled:opacity-60"
      >
        {isPending ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        Recibirás la cotización aquí mismo en Planneo.
      </p>
    </form>
  )
}
