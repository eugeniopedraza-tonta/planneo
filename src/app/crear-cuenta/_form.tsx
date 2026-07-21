'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { registerClient, type State } from './_actions'

const inputCls =
  'h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#C77DFF] focus:bg-white/[0.07] transition-colors'

export default function ClientRegisterForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<State, FormData>(registerClient, {})
  // Permite volver a editar los datos sin perder lo escrito (los campos solo se ocultan).
  const [editingData, setEditingData] = useState(false)

  useEffect(() => {
    setEditingData(false)
  }, [state])

  const codeStep = !!state.codeSent && !editingData

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="intent" value={codeStep ? 'verify' : 'request'} />

      {/* Los datos se ocultan (no se desmontan) en el paso del código para
          que sigan enviándose con el formulario. */}
      <div className={codeStep ? 'hidden' : 'flex flex-col gap-4'}>
        <Field label="Tu nombre *" error={state.fieldErrors?.name}>
          <input name="name" required placeholder="Nombre completo" className={inputCls} />
        </Field>

        <Field label="Email *" error={state.fieldErrors?.email}>
          <input
            name="email"
            type="email"
            required
            placeholder="tu@correo.com"
            autoComplete="email"
            className={inputCls}
          />
        </Field>

        <Field label="Contraseña *" error={state.fieldErrors?.password}>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
      </div>

      {codeStep && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Te enviamos un código de 6 dígitos a tu correo. Escríbelo aquí para confirmar tu cuenta.
          </p>
          <Field label="Código de verificación *">
            <input
              name="code"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              className={`${inputCls} text-center text-lg tracking-[0.5em] font-mono`}
            />
          </Field>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-[#7B2CBF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6B22AE] disabled:opacity-60"
      >
        {isPending
          ? codeStep ? 'Verificando…' : 'Enviando código…'
          : codeStep ? 'Confirmar y crear cuenta' : 'Crear mi cuenta'}
      </button>

      {codeStep && (
        <div className="flex items-center justify-center gap-4 text-xs text-white/45">
          <button
            type="submit"
            name="resend"
            value="1"
            formNoValidate
            disabled={isPending}
            className="underline hover:text-white/70 transition-colors"
          >
            Reenviar código
          </button>
          <button
            type="button"
            onClick={() => setEditingData(true)}
            disabled={isPending}
            className="underline hover:text-white/70 transition-colors"
          >
            Corregir mis datos
          </button>
        </div>
      )}

      <p className="text-center text-xs text-white/35">
        Al crear tu cuenta aceptas los{' '}
        <Link href="/terminos" className="underline hover:text-white/60">Términos de uso</Link>
        {' '}y la{' '}
        <Link href="/privacidad" className="underline hover:text-white/60">Política de privacidad</Link>.
      </p>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/75">{label}</label>
      {children}
      {error?.[0] && <p className="text-xs text-red-400">{error[0]}</p>}
    </div>
  )
}
