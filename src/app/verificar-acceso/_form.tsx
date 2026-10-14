'use client'

import { useActionState, useEffect, useState } from 'react'
import CodeInput from '@/components/code-input'
import { verifyAccess } from './_actions'

const RESEND_DELAY_SECONDS = 30

export default function VerifyForm() {
  const [state, formAction, isPending] = useActionState(verifyAccess, {})
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS)

  // El reenvío se habilita a los 30s para no gastar el límite de correos con
  // clics repetidos mientras el primero todavía viene en camino.
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  useEffect(() => {
    if (state.notice) setSecondsLeft(RESEND_DELAY_SECONDS)
  }, [state.notice])

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      {state.error && (
        <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.notice && !state.error && !state.codeError && (
        <div className="rounded-md border border-planneo-mint/30 bg-planneo-mint/10 px-4 py-3 text-sm text-planneo-mint">
          {state.notice}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-sm font-medium text-white/75">
          Código de acceso
        </label>
        <CodeInput
          id="code"
          name="code"
          error={!!state.codeError}
          disabled={isPending}
          describedBy={state.codeError ? 'code-msg' : undefined}
        />
        {state.codeError && (
          <p id="code-msg" className="text-xs text-red-400">{state.codeError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
      >
        {isPending ? 'Verificando…' : 'Continuar'}
      </button>

      <button
        type="submit"
        name="resend"
        value="1"
        formNoValidate
        disabled={isPending || secondsLeft > 0}
        className="text-center text-xs text-white/45 underline transition-colors hover:text-white/70 disabled:no-underline disabled:opacity-60"
      >
        {secondsLeft > 0 ? `Reenviar código en ${secondsLeft}s` : 'Reenviar código'}
      </button>
    </form>
  )
}
