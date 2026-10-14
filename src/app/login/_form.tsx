'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import CodeInput from '@/components/code-input'
import { loginWithCode, type LoginState } from './_actions'

const RESEND_DELAY_SECONDS = 30

const inputCls =
  'h-11 w-full rounded-xl border border-input bg-white/10 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-planneo-300 focus-visible:ring-2 focus-visible:ring-planneo-300'

const buttonCls =
  'v4-cta-glow mt-2 w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60'

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginWithCode, {
    step: 'email',
  })
  // Controlado para que el valor sobreviva al reset del formulario tras cada action.
  const [email, setEmail] = useState('')
  const [editingEmail, setEditingEmail] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Cada respuesta de la action reinicia la vista (patrón "ajustar estado al
  // cambiar una prop", sin efecto): vuelve al paso del código y, si se acaba de
  // enviar uno, arranca la espera para reenviar.
  const [seenState, setSeenState] = useState(state)
  if (seenState !== state) {
    setSeenState(state)
    setEditingEmail(false)
    if (state.step === 'code' && !state.fieldErrors && !state.error) {
      setSecondsLeft(RESEND_DELAY_SECONDS)
    }
  }

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  const codeStep = state.step === 'code' && !editingEmail
  const emailError = state.fieldErrors?.email?.[0]
  const codeError = state.fieldErrors?.code?.[0]

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {state.error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.notice && !state.error && (
        <div className="rounded-xl border border-planneo-mint/30 bg-planneo-mint/10 px-4 py-3 text-sm text-planneo-mint">
          {state.notice}
        </div>
      )}

      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="intent" value={codeStep ? 'verify' : 'request'} />

      {/* El correo se oculta (no se desmonta) en el paso del código para que
          siga viajando con el formulario. */}
      <div className={codeStep ? 'hidden' : 'flex flex-col gap-1.5'}>
        <label htmlFor="email" className="text-sm font-medium text-white/75">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby="email-msg"
          className={inputCls}
        />
        {emailError ? (
          <p id="email-msg" className="text-xs text-red-400">{emailError}</p>
        ) : (
          <p id="email-msg" className="text-xs text-white/40">
            Te enviaremos un código de acceso. No necesitas contraseña.
          </p>
        )}
      </div>

      {codeStep && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-white/70">
            Si hay una cuenta con <span className="font-medium text-white/90">{state.email}</span>, te
            llegó un código de 6 dígitos.
          </p>
          <label htmlFor="code" className="mt-2 text-sm font-medium text-white/75">
            Código de acceso
          </label>
          <CodeInput
            key={state.email}
            id="code"
            name="code"
            disabled={isPending}
            error={!!codeError}
            describedBy={codeError ? 'code-msg' : undefined}
          />
          {codeError && <p id="code-msg" className="text-xs text-red-400">{codeError}</p>}
        </div>
      )}

      <button type="submit" disabled={isPending} className={buttonCls}>
        {isPending
          ? codeStep ? 'Entrando…' : 'Enviando código…'
          : codeStep ? 'Entrar' : 'Enviarme el código'}
      </button>

      {codeStep && (
        <div className="flex items-center justify-center gap-4 text-xs text-white/45">
          <button
            type="submit"
            name="resend"
            value="1"
            formNoValidate
            disabled={isPending || secondsLeft > 0}
            className="underline transition-colors hover:text-white/70 disabled:no-underline disabled:opacity-60"
          >
            {secondsLeft > 0 ? `Reenviar código en ${secondsLeft}s` : 'Reenviar código'}
          </button>
          <button
            type="button"
            onClick={() => setEditingEmail(true)}
            disabled={isPending}
            className="underline transition-colors hover:text-white/70"
          >
            Usar otro correo
          </button>
        </div>
      )}

      {codeStep && (
        <p className="text-center text-xs text-white/40">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registrarme" className="text-planneo-300 hover:text-white transition-colors">
            Registra tu negocio
          </Link>
        </p>
      )}
    </form>
  )
}
