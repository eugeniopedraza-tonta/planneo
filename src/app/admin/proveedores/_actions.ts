'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateProviderSlug } from '@/lib/slug'
import { CATEGORY_SLUGS, EVENT_TYPE_VALUES } from '@/lib/constants'
import type { EventType, PriceRange } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  description: z.string().optional(),
  event_types: z.array(z.enum(EVENT_TYPE_VALUES)).optional(),
  price_range: z.enum(['$', '$$', '$$$']).optional(),
  instagram_handle: z.string().optional(),
  birth_date: z.string().optional(),
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
    phone: formData.get('phone'),
    email: formData.get('email'),
    description: formData.get('description'),
    event_types: formData.getAll('event_types'),
    price_range: formData.get('price_range'),
    instagram_handle: formData.get('instagram_handle'),
    birth_date: formData.get('birth_date'),
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
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    description: parsed.data.description || null,
    event_types: (parsed.data.event_types as EventType[]) ?? null,
    price_range: (parsed.data.price_range as PriceRange) ?? null,
    instagram_handle: parsed.data.instagram_handle || null,
    birth_date: parsed.data.birth_date || null,
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
    phone: formData.get('phone'),
    email: formData.get('email'),
    description: formData.get('description'),
    event_types: formData.getAll('event_types'),
    price_range: formData.get('price_range'),
    instagram_handle: formData.get('instagram_handle'),
    birth_date: formData.get('birth_date'),
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
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      description: parsed.data.description || null,
      event_types: (parsed.data.event_types as EventType[]) ?? null,
      price_range: (parsed.data.price_range as PriceRange) ?? null,
      instagram_handle: parsed.data.instagram_handle || null,
      birth_date: parsed.data.birth_date || null,
      photos: photos.length ? photos : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/proveedores')
  redirect('/admin/proveedores')
}

export async function toggleProviderStatus(id: string, currentStatus: string) {
  const supabase = await requireAdmin()
  // Despublicar es pausar, no volver a borrador: 'draft' significa "nunca se
  // publicó" y el proveedor conserva su historial y sus datos al pausarse.
  const publishing = currentStatus !== 'published'
  const now = new Date().toISOString()

  await supabase
    .from('providers')
    .update(
      publishing
        ? { status: 'published', published_at: now, paused_at: null }
        : { status: 'paused', paused_at: now }
    )
    .eq('id', id)

  revalidatePath('/admin/proveedores')
  await revalidateProviderPublicPage(supabase, id)
}

/**
 * El perfil público se sirve con ISR (`revalidate = 3600`), así que sin esto un
 * perfil pausado seguiría visible hasta una hora después.
 */
async function revalidateProviderPublicPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  providerId: string
) {
  const { data } = await supabase
    .from('providers')
    .select('slug, categories(slug)')
    .eq('id', providerId)
    .maybeSingle()

  const categorySlug = (data?.categories as unknown as { slug: string } | null)?.slug
  if (data?.slug && categorySlug) {
    revalidatePath(`/${categorySlug}/${data.slug}`)
  }
  revalidatePath('/proveedores')
  revalidatePath('/sitemap.xml')
}

export async function deleteProvider(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('providers').delete().eq('id', id)
  revalidatePath('/admin/proveedores')
}

const CsvRowSchema = z.object({
  nombre: z.string().min(1),
  categoria_slug: z.enum(CATEGORY_SLUGS),
  phone: z.string().optional(),
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

    const { nombre, categoria_slug, phone, zona, instagram } = parsed.data
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
      phone: phone || null,
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
