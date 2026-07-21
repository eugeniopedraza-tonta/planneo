'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { VENUE_AMENITIES } from '@/lib/constants'

export type State = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }

const VenueSchema = z.object({
  capacity_min: z.coerce.number().int().positive().optional().or(z.literal('')),
  capacity_max: z.coerce.number().int().positive().optional().or(z.literal('')),
  address: z.string().optional(),
  indoor: z.coerce.boolean().optional(),
  outdoor: z.coerce.boolean().optional(),
  parking: z.coerce.boolean().optional(),
  catering_allowed: z.coerce.boolean().optional(),
})

export async function saveVenueDetails(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = VenueSchema.safeParse({
    capacity_min: formData.get('capacity_min'),
    capacity_max: formData.get('capacity_max'),
    address: formData.get('address'),
    indoor: formData.get('indoor') === 'on',
    outdoor: formData.get('outdoor') === 'on',
    parking: formData.get('parking') === 'on',
    catering_allowed: formData.get('catering_allowed') === 'on',
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  if (
    parsed.data.capacity_min &&
    parsed.data.capacity_max &&
    parsed.data.capacity_max < parsed.data.capacity_min
  ) {
    return { fieldErrors: { capacity_max: ['Debe ser mayor o igual a la capacidad mínima'] } }
  }

  const validAmenities = new Set<string>(VENUE_AMENITIES)
  const amenities = formData
    .getAll('amenities')
    .map(String)
    .filter((a) => validAmenities.has(a))

  const { error } = await supabase.from('venue_details').upsert(
    {
      provider_id: provider.id,
      capacity_min: parsed.data.capacity_min || null,
      capacity_max: parsed.data.capacity_max || null,
      address: parsed.data.address?.trim() || null,
      indoor: parsed.data.indoor ?? false,
      outdoor: parsed.data.outdoor ?? false,
      parking: parsed.data.parking ?? false,
      catering_allowed: parsed.data.catering_allowed ?? false,
      amenities: amenities.length > 0 ? amenities : null,
    },
    { onConflict: 'provider_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/panel/salon')
  return { success: true }
}
