import { createClient } from '@/lib/supabase/server'
import { VENUE_CATEGORY_SLUG } from '@/lib/constants'
import type { VenueDetails } from '@/lib/types'
import { getOwnedProviderWithCategory } from '../../_lib/owned-provider'
import VenueForm, { FloorPlanSection } from './_venue-form'

export const dynamic = 'force-dynamic'

export default async function SalonPage() {
  const supabase = await createClient()
  const provider = await getOwnedProviderWithCategory(supabase)

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  if (provider.categories?.slug !== VENUE_CATEGORY_SLUG) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">
          Esta sección es solo para proveedores de la categoría Salones de Eventos.
        </p>
      </div>
    )
  }

  const { data: details } = await supabase
    .from('venue_details')
    .select('*')
    .eq('provider_id', provider.id)
    .maybeSingle<VenueDetails>()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mi salón</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Capacidad, ubicación y amenidades. Esta información aparece en tu perfil público.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <VenueForm details={details ?? null} />
        <FloorPlanSection floorPlanUrl={details?.floor_plan_url ?? null} />
      </div>
    </div>
  )
}
