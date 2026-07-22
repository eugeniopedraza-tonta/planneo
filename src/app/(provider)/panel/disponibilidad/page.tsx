import { createClient } from '@/lib/supabase/server'
import type { ProviderAvailability } from '@/lib/types'
import AvailabilityCalendar from './_availability-calendar'

export const dynamic = 'force-dynamic'

export default async function DisponibilidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  const { data: availability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', provider.id)
    .order('date')
    .returns<ProviderAvailability[]>()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Disponibilidad</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Marca tus fechas libres, reservadas o tentativas. Las notas son privadas: solo tú las ves.
        </p>
      </div>
      <AvailabilityCalendar initialAvailability={availability ?? []} />
    </div>
  )
}
