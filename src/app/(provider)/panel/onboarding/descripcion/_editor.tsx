'use client'

import { useActionState, useState } from 'react'
import { saveDescription, type State } from '../_actions'
import { MIN_DESCRIPTION_LENGTH } from '@/lib/constants'

type Props = {
  question: string
  chips: string[]
  businessName: string
  categoryName: string
  zona: string | null
  initialDescription: string
}

export default function DescriptionEditor({
  question,
  chips,
  businessName,
  categoryName,
  zona,
  initialDescription,
}: Props) {
  const [state, formAction, isPending] = useActionState(saveDescription, {} as State)
  const [selected, setSelected] = useState<string[]>([])
  const [text, setText] = useState(initialDescription)

  const toggle = (chip: string) => {
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    )
  }

  // Borrador determinista con las respuestas del proveedor. Siempre queda
  // editable: es un punto de partida, no un texto que se publique tal cual.
  const buildDraft = () => {
    const list = selected.length ? selected.join(', ').toLowerCase() : categoryName.toLowerCase()
    const where = zona ? ` en ${zona}` : ' en Monterrey'
    setText(
      `${businessName} ofrece ${categoryName.toLowerCase()} para ${list}${where}. ` +
        `Cuéntanos aquí qué te distingue: cómo trabajas, qué incluye tu servicio y qué pueden esperar de ti.`
    )
  }

  const length = text.trim().replace(/\s+/g, ' ').length
  const remaining = MIN_DESCRIPTION_LENGTH - length

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      {state.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-white/80">{question}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => toggle(chip)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected.includes(chip)
                  ? 'border-planneo-300 bg-planneo-600/25 text-white'
                  : 'border-white/15 bg-white/[0.04] text-white/65 hover:border-white/30'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={buildDraft}
          className="mt-3 text-xs text-planneo-300 underline hover:text-white"
        >
          Generar un borrador con mis respuestas
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-white/75">
          Tu descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe con tus palabras qué ofreces y para qué eventos."
          className="w-full resize-y rounded-md border border-input bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-planneo-300 focus-visible:ring-2 focus-visible:ring-planneo-300"
        />
        <p className={`text-xs ${remaining > 0 ? 'text-white/40' : 'text-planneo-mint'}`}>
          {remaining > 0
            ? `Faltan ${remaining} caracteres (mínimo ${MIN_DESCRIPTION_LENGTH}).`
            : `${length} caracteres — listo.`}
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-planneo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
        >
          {isPending ? 'Guardando…' : 'Guardar descripción'}
        </button>
      </div>
    </form>
  )
}
