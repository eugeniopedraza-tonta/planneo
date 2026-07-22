'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { registerProvider } from './_actions'
import type { Category } from '@/lib/types'

type Props = {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  zonas: string[]
}

export default function RegisterForm({ categories, zonas }: Props) {
  const [state, formAction, isPending] = useActionState(registerProvider, {})
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

      <input type="hidden" name="intent" value={codeStep ? 'verify' : 'request'} />

      {/* Los datos se ocultan (no se desmontan) en el paso del código para
          que sigan enviándose con el formulario. */}
      <div className={codeStep ? 'hidden' : 'contents'}>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Tu negocio</h2>

        <Field label="Nombre del negocio *" error={state.fieldErrors?.business_name}>
          <input
            name="business_name"
            required
            placeholder="Estudio Foto Luna, DJ Marcos, etc."
            className={inputCls}
          />
        </Field>

        <Field label="Categoría *" error={state.fieldErrors?.category_id}>
          <select name="category_id" required defaultValue="" className={inputCls}>
            <option value="" disabled>Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Zona principal" error={state.fieldErrors?.zona}>
          <select name="zona" defaultValue="" className={inputCls}>
            <option value="">Selecciona una zona</option>
            {zonas.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </Field>

        <Field label="WhatsApp" error={state.fieldErrors?.whatsapp}>
          <input
            name="whatsapp"
            type="tel"
            placeholder="+52 81 1234 5678"
            className={inputCls}
          />
        </Field>

        <Field label="Descripción breve" error={state.fieldErrors?.description}>
          <textarea
            name="description"
            rows={3}
            placeholder="¿Qué haces y para qué tipo de eventos?"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4 border-t border-white/10 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Tu cuenta</h2>

        <Field label="Nombre de contacto *" error={state.fieldErrors?.contact_name}>
          <input
            name="contact_name"
            required
            placeholder="Tu nombre completo"
            className={inputCls}
          />
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
      </section>
      </div>

      {codeStep && (
        <section className="flex flex-col gap-4">
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
        </section>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
      >
        {isPending
          ? codeStep ? 'Verificando…' : 'Enviando código…'
          : codeStep ? 'Confirmar y enviar solicitud' : 'Registrar mi negocio'}
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
        Al registrarte aceptas los{' '}
        <Link href="/terminos" className="underline hover:text-white/60">Términos de uso</Link>
        {' '}y la{' '}
        <Link href="/privacidad" className="underline hover:text-white/60">Política de privacidad</Link>.
      </p>
    </form>
  )
}

const inputCls =
  'h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-planneo-300 focus:bg-white/[0.07] transition-colors'

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
