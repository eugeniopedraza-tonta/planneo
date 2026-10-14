'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { State } from './_actions'

type Action = (prev: State, formData: FormData) => Promise<State>

type Props = {
  startAction: Action
  claimAsCurrentUserAction: Action
  reportAction: Action
  sessionEmail: string | null
  ownedProviderName: string | null
  isAdmin: boolean
  businessName: string
}

export default function ClaimFlow({
  startAction,
  claimAsCurrentUserAction,
  reportAction,
  sessionEmail,
  ownedProviderName,
  isAdmin,
  businessName,
}: Props) {
  // El formulario aparece solo después de confirmar la propiedad: primero el
  // valor (la vista previa), después los datos.
  const [confirming, setConfirming] = useState(false)

  if (isAdmin) {
    return (
      <Card>
        <p className="text-sm text-white/70">
          Estás con una cuenta de administrador. Cierra sesión y abre este enlace de nuevo para
          reclamar el perfil como proveedor.
        </p>
      </Card>
    )
  }

  if (ownedProviderName) {
    return (
      <Card>
        <p className="text-sm text-white/70">
          Ya administras <span className="font-medium text-white">{ownedProviderName}</span> con esta
          cuenta. Cada cuenta puede tener un solo perfil.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/panel"
            className="rounded-xl bg-planneo-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
          >
            Ir a mi panel
          </Link>
          <a href="mailto:hola@planneo.mx" className="text-center text-xs text-white/45 underline">
            Escríbenos si este negocio también es tuyo
          </a>
        </div>
      </Card>
    )
  }

  if (sessionEmail) {
    return (
      <LoggedInClaim
        action={claimAsCurrentUserAction}
        reportAction={reportAction}
        email={sessionEmail}
        businessName={businessName}
      />
    )
  }

  if (!confirming) {
    return (
      <Card>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
        >
          Sí, este negocio es mío
        </button>
        <NotMyBusiness action={reportAction} />
      </Card>
    )
  }

  return <ContactStep action={startAction} reportAction={reportAction} />
}

function LoggedInClaim({
  action,
  reportAction,
  email,
  businessName,
}: {
  action: Action
  reportAction: Action
  email: string
  businessName: string
}) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <Card>
      <ErrorBox error={state.error} />
      <p className="text-sm text-white/70">
        Confirmarás que <span className="font-medium text-white">{businessName}</span> es tuyo y se
        vinculará a tu cuenta <span className="font-medium text-white">{email}</span>.
      </p>
      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
        >
          {isPending ? 'Activando…' : 'Sí, este negocio es mío'}
        </button>
      </form>
      <NotMyBusiness action={reportAction} />
    </Card>
  )
}

function ContactStep({ action, reportAction }: { action: Action; reportAction: Action }) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <Card>
      <ErrorBox error={state.error} />
      <h3 className="text-base font-semibold text-white">Confirma tus datos</h3>
      <p className="mt-1 text-sm text-white/55">
        Te enviaremos un código para que solo tú puedas administrar este perfil.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <Field id="contact_name" label="Nombre de contacto" error={state.fieldErrors?.contact_name}>
          <input id="contact_name" name="contact_name" autoComplete="name" required maxLength={80} placeholder="Tu nombre" className={inputCls} />
        </Field>

        <Field id="claim-email" label="Email de acceso" error={state.fieldErrors?.email}>
          <input
            id="claim-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            className={inputCls}
          />
        </Field>

        <Field
          id="phone"
          label="Teléfono / WhatsApp"
          error={state.fieldErrors?.phone}
          hint="Lo usamos para confirmar el negocio. No se publica automáticamente."
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+52 81 1234 5678"
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
        >
          {isPending ? 'Enviando código…' : 'Enviar código y continuar'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-white/40">
        Al activar tu perfil aceptas los{' '}
        <Link href="/terminos" className="underline hover:text-white/60">Términos</Link> y la{' '}
        <Link href="/privacidad" className="underline hover:text-white/60">Política de privacidad</Link>.
      </p>

      <NotMyBusiness action={reportAction} />
    </Card>
  )
}

/**
 * Envío explícito en vez de enlace: así el reporte solo se registra cuando la
 * persona lo decide, no cuando el navegador precarga la página.
 */
function NotMyBusiness({ action }: { action: Action }) {
  const [, formAction, isPending] = useActionState(action, {} as State)

  return (
    <form action={formAction} className="mt-4 text-center">
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-white/45 underline transition-colors hover:text-white/70 disabled:opacity-60"
      >
        {isPending ? 'Enviando…' : 'Este no es mi negocio'}
      </button>
    </form>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-planneo-900 p-6 shadow-sm">{children}</div>
  )
}

function ErrorBox({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {error}
    </div>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-input bg-white/10 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-planneo-300 focus-visible:ring-2 focus-visible:ring-planneo-300'

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string[]
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white/75">{label}</label>
      {children}
      {error?.[0] ? (
        <p className="text-xs text-red-400">{error[0]}</p>
      ) : hint ? (
        <p className="text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  )
}
