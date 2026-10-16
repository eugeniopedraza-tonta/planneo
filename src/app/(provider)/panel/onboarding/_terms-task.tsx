'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { acceptTerms } from './_actions'
import type { State } from './_actions'

export default function TermsTask({ done }: { done: boolean }) {
  const [state, formAction, isPending] = useActionState(
    async () => acceptTerms(),
    {} as State
  )

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        done ? 'border-planneo-mint/25 bg-planneo-mint/[0.06]' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
            done
              ? 'border-planneo-mint bg-planneo-mint/20 text-planneo-mint'
              : 'border-white/25 text-transparent'
          }`}
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">Aceptar términos y privacidad</h3>
          <p className="mt-0.5 text-sm text-white/55">
            Necesario para publicar tu perfil.{' '}
            <Link href="/terminos" className="underline hover:text-white/75">Términos</Link>
            {' · '}
            <Link href="/privacidad" className="underline hover:text-white/75">Privacidad</Link>
          </p>
          {state.error && <p className="mt-2 text-xs text-red-400">{state.error}</p>}
        </div>

        {done ? (
          <span className="shrink-0 self-start rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/55">
            Aceptado
          </span>
        ) : (
          <form action={formAction} className="shrink-0">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-planneo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Aceptar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
