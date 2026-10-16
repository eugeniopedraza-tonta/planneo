import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadOnboardingState } from '../../_lib/readiness'
import { PROVIDER_STATUS_LABELS } from '@/lib/constants'
import { getPublicationPolicy } from '@/lib/publication-policy'
import type { ReadinessTask } from '@/lib/provider-readiness'
import TaskCard, { type TaskState } from './_task-card'
import TermsTask from './_terms-task'
import PublishPanel from './_publish-panel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Activa tu perfil',
  robots: { index: false, follow: false },
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await loadOnboardingState(supabase, user.id)
  if (!state) redirect('/registrarme')

  const { provider, readiness, photoCount, packageCount, availabilityCount, progress } = state
  const missing = new Set<ReadinessTask>(readiness.missing.map((m) => m.task))
  const isPublished = provider.status === 'published'

  const taskState = (task: ReadinessTask): TaskState => (missing.has(task) ? 'pending' : 'done')

  return (
    <div className="max-w-3xl p-6 sm:p-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/70">
            {PROVIDER_STATUS_LABELS[provider.status]}
          </span>
          {progress?.last_seen_at && (
            <span className="text-xs text-planneo-mint">Guardado</span>
          )}
        </div>

        <h1 className="mt-3 text-xl font-semibold text-white">
          {isPublished
            ? 'Tu perfil está activo'
            : `Tu perfil está al ${readiness.percent}%`}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {isPublished
            ? 'Puedes seguir mejorándolo cuando quieras.'
            : 'Completa estas tareas para que las personas entiendan tu servicio y puedan enviarte una cotización.'}
        </p>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-planneo-mint transition-[width] duration-500"
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-white/45">
          {readiness.completed} de {readiness.total} tareas obligatorias
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
          Para publicar
        </h2>

        <TaskCard
          state={taskState('basics')}
          title="Revisar datos básicos"
          reason="Nombre, categoría y contacto correctos son lo primero que se revisa."
          href="/panel/perfil"
          cta="Revisar datos"
        />

        <TaskCard
          state={taskState('coverage')}
          title="Indicar dónde atiendes"
          reason="Te muestra a quienes hacen su evento en tu zona."
          href="/panel/perfil"
          cta="Elegir zona"
        />

        <TaskCard
          state={taskState('media')}
          title="Agregar una foto o tu logo"
          reason="Un perfil sin imagen casi no recibe solicitudes."
          href="/panel/fotos"
          cta="Subir foto"
          detail={photoCount > 0 ? `${photoCount} foto${photoCount === 1 ? '' : 's'}` : undefined}
        />

        <TaskCard
          state={taskState('description')}
          title="Describir tu servicio"
          reason="Una descripción clara ayuda a que te contacten por el servicio correcto."
          href="/panel/onboarding/descripcion"
          cta="Escribir descripción"
        />

        <TaskCard
          state={taskState('event_types')}
          title="Elegir tipos de evento"
          reason="Te conecta con el tipo de celebración que sí atiendes."
          href="/panel/onboarding/eventos"
          cta="Elegir eventos"
          detail={
            provider.event_types?.length
              ? `${provider.event_types.length} seleccionados`
              : undefined
          }
        />

        <TermsTask done={!missing.has('terms')} />
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
          Opcional — mejora tus cotizaciones
        </h2>

        <TaskCard
          state={packageCount > 0 ? 'done' : 'optional'}
          title="Añadir un paquete o rango de precio"
          reason="Quien ya conoce tu rango pide cotizaciones más serias."
          href="/panel/paquetes"
          cta="Agregar paquete"
          detail={packageCount > 0 ? `${packageCount} paquete${packageCount === 1 ? '' : 's'}` : undefined}
        />

        <TaskCard
          state={availabilityCount > 0 ? 'done' : 'optional'}
          title="Marcar fechas ocupadas"
          reason="Evita consultas para fechas en las que no puedes."
          href="/panel/disponibilidad"
          cta="Marcar fechas"
          detail={availabilityCount > 0 ? `${availabilityCount} fechas` : undefined}
        />
      </section>

      <PublishPanel
        isReady={readiness.isReady}
        status={provider.status}
        missingLabels={readiness.missing.map((m) => m.label)}
        policy={getPublicationPolicy()}
      />

      <p className="mt-6 text-center">
        <Link href="/panel" className="text-xs text-white/45 underline hover:text-white/70">
          Salir y continuar después
        </Link>
      </p>
    </div>
  )
}
