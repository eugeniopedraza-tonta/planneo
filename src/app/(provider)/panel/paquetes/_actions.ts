'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type State = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }

const PackageSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price_from: z.coerce.number().positive().optional().or(z.literal('')),
  price_to: z.coerce.number().positive().optional().or(z.literal('')),
  price_unit: z.enum(['por_evento', 'por_hora', 'por_persona']).optional().or(z.literal('')),
  includes: z.string().optional(),
  is_featured: z.coerce.boolean().optional(),
})

async function getProviderForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', userId)
    .maybeSingle()
  return data
}

export async function createPackage(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const provider = await getProviderForUser(supabase, user.id)
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = PackageSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price_from: formData.get('price_from'),
    price_to: formData.get('price_to'),
    price_unit: formData.get('price_unit'),
    includes: formData.get('includes'),
    is_featured: formData.get('is_featured') === 'on',
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const includesArr = parsed.data.includes
    ? parsed.data.includes.split('\n').map((s) => s.trim()).filter(Boolean)
    : null

  const { error } = await supabase.from('service_packages').insert({
    provider_id: provider.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_from: parsed.data.price_from || null,
    price_to: parsed.data.price_to || null,
    price_unit: parsed.data.price_unit || null,
    includes: includesArr,
    is_featured: parsed.data.is_featured ?? false,
  })

  if (error) return { error: error.message }

  revalidatePath('/panel/paquetes')
  return { success: true }
}

export async function updatePackage(
  packageId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = PackageSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price_from: formData.get('price_from'),
    price_to: formData.get('price_to'),
    price_unit: formData.get('price_unit'),
    includes: formData.get('includes'),
    is_featured: formData.get('is_featured') === 'on',
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const includesArr = parsed.data.includes
    ? parsed.data.includes.split('\n').map((s) => s.trim()).filter(Boolean)
    : null

  const { error } = await supabase
    .from('service_packages')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_from: parsed.data.price_from || null,
      price_to: parsed.data.price_to || null,
      price_unit: parsed.data.price_unit || null,
      includes: includesArr,
      is_featured: parsed.data.is_featured ?? false,
    })
    .eq('id', packageId)

  if (error) return { error: error.message }

  revalidatePath('/panel/paquetes')
  return { success: true }
}

export async function deletePackage(packageId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('service_packages')
    .delete()
    .eq('id', packageId)

  if (error) return { error: error.message }

  revalidatePath('/panel/paquetes')
  return {}
}
