'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  pauseProviderProfile,
  requestProviderPublication,
  resumeProviderProfile,
  type State,
} from './_actions'
import type { PublicationPolicy } from '@/lib/publication-policy'
import type { ProviderStatus } from '@/lib/types'

type Props = {
  isReady: boolean
  status: ProviderStatus
  missingLabels: string[]
  policy: PublicationPolicy
}

export default function PublishPanel({ isReady, status, missingLabels, policy }: Props) {
  const [publishState, publishAction, publishing] = useActionState(
    async () => requestProviderPublication(),
    {} as State
  )
  const [pauseState, pauseAction, pausing] = useActionState(
    async () => pauseProviderProfile(),
    {} as State
  )
  const [resumeState, resumeAction, resuming] = useActionState(
    async () => resumeProviderProfile(),
    {} as State
  )

  const error = publishState.error ?? pauseState.error ?? resumeState.error

  if (status === 'pending_review') {
    return (
      <Panel>
        <h2 className="text-base font-semibold text-white">Tu perfil está en revisión</h2>
        <p className="mt-1 text-sm text-white/60">
          Lo revisamos en las próximas 24–48 horas y te avisamos por correo. Mientras tanto puedes
          seguir mejorándolo.
        </p>
      </Panel>
    )
  }

  if (status === 'published') {
    return (
      <Panel>
        <h2 className="text-base font-semibold text-white">Tu perfil está activo</h2>
        <p className="mt-1 text-sm text-white/60">
          Las personas pueden conocer tu servicio y enviarte una cotización desde Planneo.
        </p>
        {error && <ErrorLine>{error}</ErrorLine>}
        <form action={pauseAction} className="mt-4">
          <button
            type="submit"
            disabled={pausing}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:border-white/30 disabled:opacity-60"
          >
            {pausing ? 'Pausando…' : 'Pausar mi perfil'}
          </button>
          <p className="mt-1.5 text-xs text-white/40">
            Deja de aparecer en el catálogo. No se borra nada y puedes reactivarlo cuando quieras.
          </p>
        </form>
      </Panel>
    )
  }

  if (status === 'paused') {
    return (
      <Panel>
        <h2 className="text-base font-semibold text-white">Tu perfil está pausado</h2>
        <p className="mt-1 text-sm text-white/60">
          No aparece en el catálogo ni en las búsquedas. Tus datos siguen guardados.
        </p>
        {error && <ErrorLine>{error}</ErrorLine>}
        <form action={resumeAction} className="mt-4">
          <button
            type="submit"
            disabled={resuming}
            className="rounded-xl bg-planneo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
          >
            {resuming ? 'Reactivando…' : 'Reactivar mi perfil'}
          </button>
        </form>
      </Panel>
    )
  }

  return (
    <Panel>
      {status === 'rejected' && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
          <p className="text-sm font-medium text-red-300">Tu perfil necesita cambios</p>
          <p className="mt-0.5 text-sm text-red-300/85">
            Revisa el correo que te enviamos, ajusta lo señalado y vuelve a enviarlo.
          </p>
        </div>
      )}

      <h2 className="text-base font-semibold text-white">
        {isReady ? 'Listo para publicar' : 'Todavía falta un poco'}
      </h2>
      <p className="mt-1 text-sm text-white/60">
        {isReady
          ? policy === 'auto_publish'
            ? 'Al publicar, tu perfil aparecerá en el catálogo de inmediato.'
            : 'Lo revisaremos en 24–48 horas antes de activarlo.'
          : 'Completa estas tareas para poder publicar:'}
      </p>

      {!isReady && (
        <ul className="mt-2 flex list-disc flex-col gap-0.5 pl-5 text-sm text-white/55">
          {missingLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      )}

      {error && <ErrorLine>{error}</ErrorLine>}

      <form action={publishAction} className="mt-4">
        <button
          type="submit"
          disabled={!isReady || publishing}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-6"
        >
          {publishing
            ? 'Enviando…'
            : policy === 'auto_publish'
              ? 'Publicar mi perfil'
              : 'Enviar a revisión'}
        </button>
      </form>

      <p className="mt-3 text-xs text-white/40">
        ¿Dudas?{' '}
        <Link href="/terminos" className="underline hover:text-white/60">
          Consulta los términos
        </Link>
      </p>
    </Panel>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-planneo-900 p-5">{children}</section>
  )
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
      {children}
    </p>
  )
}
