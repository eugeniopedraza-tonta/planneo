import { createClient } from '@/lib/supabase/server'
import { VENUE_CATEGORY_SLUG } from '@/lib/constants'
import type { VenueDetails } from '@/lib/types'
import VenueForm from './_venue-form'

export const dynamic = 'force-dynamic'

export default async function SalonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id, categories(slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<{ id: string; categories: { slug: string } | null }>()

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
      <VenueForm details={details ?? null} />
    </div>
  )
}
