'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_PROVIDER,
  PHOTOS_BUCKET,
  publicMediaUrl,
} from '@/lib/media'
import type { ProviderMedia } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Autentica al usuario y devuelve el proveedor del que es dueño.
 * Todas las acciones de este módulo operan únicamente sobre ese proveedor.
 */
async function getOwnedProvider(supabase: Supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  return provider
}

async function syncPhotosArray(supabase: Supabase, providerId: string) {
  const { data } = await supabase
    .from('provider_media')
    .select('url')
    .eq('provider_id', providerId)
    .eq('type', 'photo')
    .order('sort_order')
  await supabase
    .from('providers')
    .update({ photos: data?.map((m) => m.url) ?? [] })
    .eq('id', providerId)
}

export type UploadTicket =
  | { path: string; token: string; signedUrl: string }
  | { error: string }

/**
 * Paso 1: el servidor valida y autoriza, y emite una URL firmada de corta
 * duración para que el navegador suba el archivo directo a Storage.
 * El path lo decide el servidor: {providerId}/{uuid}.{ext} — nunca el cliente.
 */
export async function requestPhotoUpload(input: {
  fileType: string
  fileSize: number
}): Promise<UploadTicket> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const ext = ALLOWED_IMAGE_TYPES[input.fileType]
  if (!ext) return { error: 'Formato no permitido. Usa JPEG, PNG, WebP o AVIF.' }
  if (input.fileSize > MAX_PHOTO_BYTES) {
    return { error: `La imagen supera el límite de ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB.` }
  }

  const { count } = await supabase
    .from('provider_media')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', provider.id)
    .eq('type', 'photo')
  if ((count ?? 0) >= MAX_PHOTOS_PER_PROVIDER) {
    return { error: `Máximo ${MAX_PHOTOS_PER_PROVIDER} fotos. Elimina alguna para subir más.` }
  }

  // Sin upsert: un path nuevo por archivo evita sobrescrituras.
  const path = `${provider.id}/${randomUUID()}.${ext}`
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) return { error: 'No se pudo preparar la carga. Intenta de nuevo.' }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

/**
 * Paso 2: tras la carga directa, el servidor verifica el objeto real en
 * Storage (tipo y tamaño reales, no los que dijo el navegador) y lo registra.
 * Si el registro falla, elimina el objeto para no dejar huérfanos.
 */
export async function confirmPhotoUpload(input: {
  path: string
  altText?: string
}): Promise<{ media?: ProviderMedia; error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  // El objeto debe vivir en la carpeta del proveedor autenticado.
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

  const { data: maxOrder } = await supabase
    .from('provider_media')
    .select('sort_order')
    .eq('provider_id', provider.id)
    .eq('type', 'photo')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: media, error } = await supabase
    .from('provider_media')
    .insert({
      provider_id: provider.id,
      type: 'photo',
      bucket: PHOTOS_BUCKET,
      path: input.path,
      url: publicMediaUrl(PHOTOS_BUCKET, input.path),
      alt_text: input.altText?.trim().slice(0, 300) || null,
      mime_type: mime,
      size_bytes: size,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single<ProviderMedia>()

  if (error || !media) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([input.path])
    return { error: 'No se pudo registrar la foto. Intenta de nuevo.' }
  }

  await syncPhotosArray(supabase, provider.id)
  revalidatePath('/panel/fotos')
  return { media }
}

export async function deletePhoto(mediaId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const { data: media } = await supabase
    .from('provider_media')
    .select('id, bucket, path')
    .eq('id', mediaId)
    .eq('provider_id', provider.id)
    .maybeSingle()
  if (!media) return { error: 'No encontrado' }

  const { error } = await supabase.from('provider_media').delete().eq('id', media.id)
  if (error) return { error: 'No se pudo eliminar la foto.' }

  // Eliminación definitiva: también el objeto del bucket.
  await supabase.storage.from(media.bucket).remove([media.path])

  await syncPhotosArray(supabase, provider.id)
  revalidatePath('/panel/fotos')
  return {}
}

/** Reordena la galería; la primera foto es la principal del perfil. */
export async function reorderPhotos(orderedIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const { data: existing } = await supabase
    .from('provider_media')
    .select('id')
    .eq('provider_id', provider.id)
    .eq('type', 'photo')
  const ownedIds = new Set(existing?.map((m) => m.id) ?? [])
  const ids = orderedIds.filter((id) => ownedIds.has(id))
  if (ids.length !== ownedIds.size) return { error: 'La lista de fotos no coincide. Recarga la página.' }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from('provider_media')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('provider_id', provider.id)
    )
  )
  if (results.some((r) => r.error)) return { error: 'No se pudo guardar el orden.' }

  await syncPhotosArray(supabase, provider.id)
  revalidatePath('/panel/fotos')
  return {}
}

export async function updatePhotoAlt(
  mediaId: string,
  altText: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('provider_media')
    .update({ alt_text: altText.trim().slice(0, 300) || null })
    .eq('id', mediaId)
    .eq('provider_id', provider.id)
  if (error) return { error: 'No se pudo guardar el texto alternativo.' }

  revalidatePath('/panel/fotos')
  return {}
}
