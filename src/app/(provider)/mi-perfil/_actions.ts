'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { EventType, PriceRange } from '@/lib/types'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

const ProfileSchema = z.object({
  description: z.string().optional(),
  whatsapp: z.string().optional(),
  price_range: z.enum(['$', '$$', '$$$']).optional().or(z.literal('')),
  event_types: z.array(z.enum(['bodas', 'xv', 'corporativo', 'graduacion'])).optional(),
  instagram_handle: z.string().optional(),
})

export async function updateMyProfile(
  _prev: State,
  formData: FormData
): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const raw = {
    description: formData.get('description'),
    whatsapp: formData.get('whatsapp'),
    price_range: formData.get('price_range'),
    event_types: formData.getAll('event_types'),
    instagram_handle: formData.get('instagram_handle'),
  }

  const parsed = ProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('providers')
    .update({
      description: parsed.data.description || null,
      whatsapp: parsed.data.whatsapp || null,
      price_range: (parsed.data.price_range as PriceRange) || null,
      event_types: (parsed.data.event_types as EventType[]) ?? null,
      instagram_handle: parsed.data.instagram_handle || null,
    })
    .eq('claimed_by', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/mi-perfil')
  return { success: true }
}
