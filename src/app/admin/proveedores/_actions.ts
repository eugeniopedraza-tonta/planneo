'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateProviderSlug } from '@/lib/slug'
import type { EventType, PriceRange } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return supabase
}

const ProviderSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  category_id: z.string().uuid('Selecciona una categoría'),
  zona: z.string().min(1, 'Requerido'),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  description: z.string().optional(),
  event_types: z.array(z.enum(['bodas', 'xv', 'corporativo', 'graduacion'])).optional(),
  price_range: z.enum(['$', '$$', '$$$']).optional(),
  instagram_handle: z.string().optional(),
})

export type ProviderActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createProvider(
  _prev: ProviderActionState,
  formData: FormData
): Promise<ProviderActionState> {
  const raw = {
    name: formData.get('name'),
    category_id: formData.get('category_id'),
    zona: formData.get('zona'),
    whatsapp: formData.get('whatsapp'),
    email: formData.get('email'),
    description: formData.get('description'),
    event_types: formData.getAll('event_types'),
    price_range: formData.get('price_range'),
    instagram_handle: formData.get('instagram_handle'),
  }

  const parsed = ProviderSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, zona } = parsed.data
  const baseSlug = generateProviderSlug(name, zona)

  const supabase = await requireAdmin()

  // Ensure unique slug
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  let photos: string[] = []
  try { photos = JSON.parse(formData.get('photos') as string ?? '[]') } catch {}

  const { error } = await supabase.from('providers').insert({
    slug,
    name: parsed.data.name,
    category_id: parsed.data.category_id,
    zona: parsed.data.zona,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    description: parsed.data.description || null,
    event_types: (parsed.data.event_types as EventType[]) ?? null,
    price_range: (parsed.data.price_range as PriceRange) ?? null,
    instagram_handle: parsed.data.instagram_handle || null,
    photos: photos.length ? photos : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  redirect('/admin/proveedores')
}

export async function updateProvider(
  id: string,
  _prev: ProviderActionState,
  formData: FormData
): Promise<ProviderActionState> {
  const raw = {
    name: formData.get('name'),
    category_id: formData.get('category_id'),
    zona: formData.get('zona'),
    whatsapp: formData.get('whatsapp'),
    email: formData.get('email'),
    description: formData.get('description'),
    event_types: formData.getAll('event_types'),
    price_range: formData.get('price_range'),
    instagram_handle: formData.get('instagram_handle'),
  }

  const parsed = ProviderSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  let photos: string[] = []
  try { photos = JSON.parse(formData.get('photos') as string ?? '[]') } catch {}

  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('providers')
    .update({
      name: parsed.data.name,
      category_id: parsed.data.category_id,
      zona: parsed.data.zona,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      description: parsed.data.description || null,
      event_types: (parsed.data.event_types as EventType[]) ?? null,
      price_range: (parsed.data.price_range as PriceRange) ?? null,
      instagram_handle: parsed.data.instagram_handle || null,
      photos: photos.length ? photos : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  redirect('/admin/proveedores')
}

export async function toggleProviderStatus(id: string, currentStatus: string) {
  const supabase = await requireAdmin()
  const newStatus = currentStatus === 'published' ? 'draft' : 'published'
  await supabase.from('providers').update({ status: newStatus }).eq('id', id)
  revalidatePath('/admin/proveedores')
}

export async function deleteProvider(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('providers').delete().eq('id', id)
  revalidatePath('/admin/proveedores')
}

const CsvRowSchema = z.object({
  nombre: z.string().min(1),
  categoria_slug: z.enum(['fotografia', 'belleza', 'musica', 'banquete', 'decoracion']),
  whatsapp: z.string().optional(),
  zona: z.string().min(1),
  instagram: z.string().optional(),
})

export async function importProvidersCsv(rows: unknown[]): Promise<{
  created: number
  errors: { row: number; message: string }[]
}> {
  const supabase = await requireAdmin()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')

  const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]) ?? [])

  const results = { created: 0, errors: [] as { row: number; message: string }[] }

  for (let i = 0; i < rows.length; i++) {
    const parsed = CsvRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      results.errors.push({ row: i + 1, message: parsed.error.issues[0].message })
      continue
    }

    const { nombre, categoria_slug, whatsapp, zona, instagram } = parsed.data
    const category_id = categoryMap.get(categoria_slug)
    if (!category_id) {
      results.errors.push({ row: i + 1, message: `Categoría inválida: ${categoria_slug}` })
      continue
    }

    const baseSlug = generateProviderSlug(nombre, zona)
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { data } = await supabase
        .from('providers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!data) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const { error } = await supabase.from('providers').insert({
      slug,
      name: nombre,
      category_id,
      zona,
      whatsapp: whatsapp || null,
      instagram_handle: instagram || null,
    })

    if (error) {
      results.errors.push({ row: i + 1, message: error.message })
    } else {
      results.created++
    }
  }

  revalidatePath('/admin/proveedores')
  return results
}
