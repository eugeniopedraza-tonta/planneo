'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPE_VALUES } from '@/lib/constants'
import type { EventType, PriceRange } from '@/lib/types'

export type State = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }

const ProfileSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  zona: z.string().optional(),
  price_range: z.enum(['$', '$$', '$$$']).optional().or(z.literal('')),
  event_types: z.array(z.enum(EVENT_TYPE_VALUES)).optional(),
  birth_date: z.string().optional(),
})

export async function updateProfile(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = ProfileSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    instagram_handle: formData.get('instagram_handle'),
    zona: formData.get('zona'),
    price_range: formData.get('price_range'),
    event_types: formData.getAll('event_types'),
    birth_date: formData.get('birth_date'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const { error } = await supabase
    .from('providers')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      instagram_handle: parsed.data.instagram_handle || null,
      zona: parsed.data.zona || null,
      price_range: (parsed.data.price_range as PriceRange) || null,
      event_types: (parsed.data.event_types as EventType[]) ?? null,
      birth_date: parsed.data.birth_date || null,
    })
    .eq('claimed_by', user.id)

  if (error) return { error: error.message }

  revalidatePath('/panel/perfil')
  return { success: true }
}
