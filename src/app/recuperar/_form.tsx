'use client'

import { useActionState, useEffect, useState } from 'react'
import CodeInput from '@/components/code-input'
import { recoverPassword, type State } from './_actions'

const inputCls =
  'h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#C77DFF] focus:bg-white/[0.07] transition-colors'

export default function RecoverPasswordForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(recoverPassword, {})
  const [editingEmail, setEditingEmail] = useState(false)
  // Controlado para que React no lo vacíe al resetear el formulario
  // tras cada server action (el paso 2 lo envía oculto).
  const [email, setEmail] = useState('')

  useEffect(() => {
    setEditingEmail(false)
  }, [state])

  const codeStep = !!state.codeSent && !editingEmail

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <input type="hidden" name="intent" value={codeStep ? 'verify' : 'request'} />

      {/* El email se oculta (no se desmonta) en el paso del código para
          que siga enviándose con el formulario. */}
      <div className={codeStep ? 'hidden' : 'flex flex-col gap-4'}>
        <Field label="Email de tu cuenta *" error={state.fieldErrors?.email}>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            className={inputCls}
          />
        </Field>
      </div>

      {codeStep && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Si existe una cuenta con ese email, te enviamos un código de 6 dígitos.
            Escríbelo aquí y elige tu nueva contraseña.
          </p>
          <Field label="Código de verificación *" error={state.fieldErrors?.code}>
            <CodeInput
              name="code"
              disabled={isPending}
              error={!!state.fieldErrors?.code || !!state.error}
            />
          </Field>
          <Field label="Nueva contraseña *" error={state.fieldErrors?.password}>
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
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-[#7B2CBF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6B22AE] disabled:opacity-60"
      >
        {isPending
          ? codeStep ? 'Restableciendo…' : 'Enviando código…'
          : codeStep ? 'Cambiar contraseña' : 'Enviarme el código'}
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
            onClick={() => setEditingEmail(true)}
            disabled={isPending}
            className="underline hover:text-white/70 transition-colors"
          >
            Corregir email
          </button>
        </div>
      )}
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
