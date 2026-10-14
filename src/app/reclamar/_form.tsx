'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * Acepta el código suelto o el enlace completo que Planneo mandó por correo o
 * WhatsApp (con o sin dominio, con parámetros de seguimiento, etc.). Los tokens
 * de reclamación son UUID, así que basta con encontrar uno en lo pegado.
 */
export function extractClaimToken(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const match = value.match(/reclamar\/([^/?#\s]+)/i)?.[1] ?? value
  const token = match.match(UUID)?.[0]
  return token ? token.toLowerCase() : null
}

export default function ClaimInviteForm() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const token = extractClaimToken(value)
    if (!token) {
      setError(
        value.trim()
          ? 'Ese enlace no parece una invitación de Planneo. Cópialo completo del mensaje.'
          : 'Pega el enlace o el código de tu invitación.'
      )
      return
    }
    setError(null)
    setPending(true)
    router.push(`/reclamar/${token}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invitation" className="text-sm font-medium text-white/75">
          Enlace o código de invitación
        </label>
        <input
          id="invitation"
          name="invitation"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="planneo.mx/reclamar/…"
          aria-invalid={error ? true : undefined}
          aria-describedby="invitation-msg"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-planneo-300"
        />
        {error ? (
          <p id="invitation-msg" className="text-xs text-red-400">{error}</p>
        ) : (
          <p id="invitation-msg" className="text-xs text-white/40">
            Lo encuentras en el correo o mensaje que te mandó Planneo.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
      >
        {pending ? 'Abriendo…' : 'Usar invitación'}
      </button>
    </form>
  )
}
