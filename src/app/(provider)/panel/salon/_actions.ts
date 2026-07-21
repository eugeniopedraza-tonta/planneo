'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { VENUE_AMENITIES, VENUE_CATEGORY_SLUG } from '@/lib/constants'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  PHOTOS_BUCKET,
  publicMediaUrl,
} from '@/lib/media'
import { getOwnedProviderWithCategory } from '../../_lib/owned-provider'
import type { UploadTicket } from '../fotos/_actions'

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

type Supabase = Awaited<ReturnType<typeof createClient>>

type VenueAuth = { ok: false; error: string } | { ok: true; provider: { id: string } }

async function getOwnedVenueProvider(supabase: Supabase): Promise<VenueAuth> {
  const provider = await getOwnedProviderWithCategory(supabase)
  if (!provider) return { ok: false, error: 'Sin perfil vinculado' }
  if (provider.categories?.slug !== VENUE_CATEGORY_SLUG) {
    return { ok: false, error: 'Esta sección es solo para la categoría Salones de Eventos' }
  }
  return { ok: true, provider }
}

export async function saveVenueDetails(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const owned = await getOwnedVenueProvider(supabase)
  if (!owned.ok) return { error: owned.error }
  const { provider } = owned

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

/**
 * Plano del salón: mismo flujo firmado que las fotos (el servidor autoriza y
 * decide el path; el navegador sube directo; el servidor verifica el objeto
 * real). Solo imágenes — el bucket no admite PDF.
 */
export async function requestFloorPlanUpload(input: {
  fileType: string
  fileSize: number
}): Promise<UploadTicket> {
  const supabase = await createClient()
  const owned = await getOwnedVenueProvider(supabase)
  if (!owned.ok) return { error: owned.error }

  const ext = ALLOWED_IMAGE_TYPES[input.fileType]
  if (!ext) return { error: 'Formato no permitido. Usa JPEG, PNG, WebP o AVIF.' }
  if (input.fileSize > MAX_PHOTO_BYTES) {
    return { error: `La imagen supera el límite de ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB.` }
  }

  const path = `${owned.provider.id}/plano-${randomUUID()}.${ext}`
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) return { error: 'No se pudo preparar la carga. Intenta de nuevo.' }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

export async function confirmFloorPlanUpload(input: {
  path: string
}): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const owned = await getOwnedVenueProvider(supabase)
  if (!owned.ok) return { error: owned.error }
  const { provider } = owned

  if (!input.path.startsWith(`${provider.id}/`) || input.path.includes('..')) {
    return { error: 'No autorizado' }
  }

  const { data: info, error: infoError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .info(input.path)
  if (infoError || !info) return { error: 'El archivo no se encontró en Storage.' }

  const mime = info.contentType ?? ''
  const size = info.size ?? 0
  if (!ALLOWED_IMAGE_TYPES[mime] || size === 0 || size > MAX_PHOTO_BYTES) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([input.path])
    return { error: 'El archivo subido no es una imagen válida.' }
  }

  const { data: existing } = await supabase
    .from('venue_details')
    .select('floor_plan_url')
    .eq('provider_id', provider.id)
    .maybeSingle()

  const url = publicMediaUrl(PHOTOS_BUCKET, input.path)
  const { error } = await supabase.from('venue_details').upsert(
    { provider_id: provider.id, floor_plan_url: url },
    { onConflict: 'provider_id' }
  )
  if (error) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([input.path])
    return { error: 'No se pudo registrar el plano. Intenta de nuevo.' }
  }

  // El plano anterior queda huérfano: eliminarlo del bucket.
  const oldPath = storagePathFromUrl(existing?.floor_plan_url)
  if (oldPath && oldPath !== input.path) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([oldPath])
  }

  revalidatePath('/panel/salon')
  return { url }
}

export async function deleteFloorPlan(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const owned = await getOwnedVenueProvider(supabase)
  if (!owned.ok) return { error: owned.error }
  const { provider } = owned

  const { data: existing } = await supabase
    .from('venue_details')
    .select('floor_plan_url')
    .eq('provider_id', provider.id)
    .maybeSingle()
  const oldPath = storagePathFromUrl(existing?.floor_plan_url)

  const { error } = await supabase
    .from('venue_details')
    .update({ floor_plan_url: null })
    .eq('provider_id', provider.id)
  if (error) return { error: 'No se pudo eliminar el plano.' }

  if (oldPath) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([oldPath])
  }

  revalidatePath('/panel/salon')
  return {}
}

function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = `/object/public/${PHOTOS_BUCKET}/`
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
}
