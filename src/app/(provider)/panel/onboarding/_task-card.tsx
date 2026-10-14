import Link from 'next/link'

export type TaskState = 'pending' | 'done' | 'optional'

/**
 * Tarjeta de tarea del hub. Las completadas no se esconden: se marcan y
 * conservan una acción para editarlas.
 */
export default function TaskCard({
  state,
  title,
  reason,
  href,
  cta,
  detail,
}: {
  state: TaskState
  title: string
  reason: string
  href: string
  cta: string
  detail?: string
}) {
  const done = state === 'done'

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
        done ? 'border-planneo-mint/25 bg-planneo-mint/[0.06]' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
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
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {state === 'optional' && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-white/50">
              Opcional
            </span>
          )}
          {detail && <span className="text-xs text-white/45">{detail}</span>}
        </div>
        <p className="mt-0.5 text-sm text-white/55">{reason}</p>
      </div>

      <Link
        href={href}
        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
          done
            ? 'border border-white/15 text-white/70 hover:border-white/30'
            : 'bg-planneo-600 text-white hover:bg-planneo-500'
        }`}
      >
        {done ? 'Editar' : cta}
      </Link>
    </div>
  )
}
