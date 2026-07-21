'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const AvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  status: z.enum(['available', 'booked', 'tentative', 'none']),
  note: z.string().max(300).optional(),
})

export async function setAvailability(input: {
  date: string
  status: 'available' | 'booked' | 'tentative' | 'none'
  note?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = AvailabilitySchema.safeParse(input)
  if (!parsed.success) return { error: 'Datos inválidos' }

  if (parsed.data.status === 'none') {
    const { error } = await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', provider.id)
      .eq('date', parsed.data.date)
    if (error) return { error: 'No se pudo actualizar el día.' }
  } else {
    const { error } = await supabase
      .from('provider_availability')
      .upsert(
        {
          provider_id: provider.id,
          date: parsed.data.date,
          status: parsed.data.status,
          note: parsed.data.note?.trim() || null,
        },
        { onConflict: 'provider_id,date' }
      )
    if (error) return { error: 'No se pudo actualizar el día.' }
  }

  revalidatePath('/panel/disponibilidad')
  return {}
}
