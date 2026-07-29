import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { loadOnboardingState } from '../../../_lib/readiness'
import EventTypesForm from './_form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tipos de evento · Planneo',
  robots: { index: false, follow: false },
}

export default async function EventosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await loadOnboardingState(supabase, user.id)
  if (!state) redirect('/registrarme')

  return (
    <div className="max-w-2xl p-6 sm:p-8">
      <Link href="/panel/onboarding" className="text-xs text-white/45 underline hover:text-white/70">
        ← Volver a la activación
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-white">¿Qué eventos atiendes?</h1>
      <p className="mt-1 text-sm text-white/60">
        Elige todos los que apliquen. Te conecta con el tipo de celebración correcta.
      </p>

      <EventTypesForm selected={state.provider.event_types ?? []} />
    </div>
  )
}
