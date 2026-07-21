'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPES, MENU_COURSES } from '@/lib/constants'

export type State = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }

const MenuSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price_per_person: z.coerce.number().positive().optional().or(z.literal('')),
  min_guests: z.coerce.number().int().positive().optional().or(z.literal('')),
})

type MenuItemInput = { course: string; name: string; description: string | null; sort_order: number }

function parseMenuForm(formData: FormData) {
  const parsed = MenuSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price_per_person: formData.get('price_per_person'),
    min_guests: formData.get('min_guests'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const validEventTypes = new Set(EVENT_TYPES.map((t) => t.value as string))
  const eventTypes = formData.getAll('event_types').map(String).filter((t) => validEventTypes.has(t))

  // Cada textarea de tiempo trae un platillo por línea; "Nombre — descripción" es opcional
  const items: MenuItemInput[] = []
  for (const course of MENU_COURSES) {
    const raw = String(formData.get(`items_${course.value}`) ?? '')
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line, i) => {
        const [name, ...rest] = line.split('—')
        items.push({
          course: course.value,
          name: name.trim(),
          description: rest.join('—').trim() || null,
          sort_order: i,
        })
      })
  }

  return {
    menu: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_per_person: parsed.data.price_per_person || null,
      min_guests: parsed.data.min_guests || null,
      event_types: eventTypes.length > 0 ? eventTypes : null,
    },
    items,
  }
}

export async function createMenu(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = parseMenuForm(formData)
  if ('fieldErrors' in parsed) return { fieldErrors: parsed.fieldErrors }

  const { data: menu, error } = await supabase
    .from('catering_menus')
    .insert({ provider_id: provider.id, ...parsed.menu })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (parsed.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('catering_menu_items')
      .insert(parsed.items.map((item) => ({ menu_id: menu.id, ...item })))
    if (itemsError) {
      await supabase.from('catering_menus').delete().eq('id', menu.id)
      return { error: itemsError.message }
    }
  }

  revalidatePath('/panel/menu')
  return { success: true }
}

export async function updateMenu(menuId: string, _prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = parseMenuForm(formData)
  if ('fieldErrors' in parsed) return { fieldErrors: parsed.fieldErrors }

  const { data: updated, error } = await supabase
    .from('catering_menus')
    .update(parsed.menu)
    .eq('id', menuId)
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: 'Menú no encontrado' }

  const { error: deleteError } = await supabase
    .from('catering_menu_items')
    .delete()
    .eq('menu_id', menuId)
  if (deleteError) return { error: deleteError.message }

  if (parsed.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('catering_menu_items')
      .insert(parsed.items.map((item) => ({ menu_id: menuId, ...item })))
    if (itemsError) return { error: itemsError.message }
  }

  revalidatePath('/panel/menu')
  return { success: true }
}

export async function deleteMenu(menuId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('catering_menus').delete().eq('id', menuId)
  if (error) return { error: error.message }

  revalidatePath('/panel/menu')
  return {}
}
