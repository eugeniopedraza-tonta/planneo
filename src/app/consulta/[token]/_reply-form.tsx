'use client'

import { useActionState, useEffect, useRef } from 'react'
import { replyAsClient } from './_actions'

export default function ClientReplyForm({ token }: { token: string }) {
  const action = replyAsClient.bind(null, token)
  const [state, formAction, isPending] = useActionState(action, {})
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  // Limpia el textarea cuando el envío termina sin error.
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) formRef.current?.reset()
    wasPending.current = isPending
  }, [isPending, state.error])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <label htmlFor="client-reply" className="text-sm font-medium text-white">
        Responder
      </label>
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      <textarea
        id="client-reply"
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Escribe tu mensaje al proveedor…"
        className="w-full text-sm border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-planneo-300/40"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-planneo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-planneo-500 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </div>
    </form>
  )
}
