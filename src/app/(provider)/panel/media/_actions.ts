'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_PROVIDER,
  MEDIA_BUCKET,
  publicMediaUrl,
} from '@/lib/media'
import type { ProviderMedia } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

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

function mediaTypeFor(mime: string): 'audio' | 'video' | null {
  if (ALLOWED_AUDIO_TYPES[mime]) return 'audio'
  if (ALLOWED_VIDEO_TYPES[mime]) return 'video'
  return null
}

export type UploadTicket =
  | { path: string; token: string; signedUrl: string }
  | { error: string }

/** Mismo flujo firmado que las fotos: el servidor autoriza y decide el path. */
export async function requestMediaUpload(input: {
  fileType: string
  fileSize: number
}): Promise<UploadTicket> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const kind = mediaTypeFor(input.fileType)
  if (!kind) return { error: 'Formato no permitido. Usa MP3, M4A, WAV o MP4.' }
  if (input.fileSize > MAX_MEDIA_BYTES) {
    return { error: `El archivo supera el límite de ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)}MB.` }
  }

  const { count } = await supabase
    .from('provider_media')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', provider.id)
    .in('type', ['audio', 'video'])
  if ((count ?? 0) >= MAX_MEDIA_PER_PROVIDER) {
    return { error: `Máximo ${MAX_MEDIA_PER_PROVIDER} archivos. Elimina alguno para subir más.` }
  }

  const ext = ALLOWED_AUDIO_TYPES[input.fileType] ?? ALLOWED_VIDEO_TYPES[input.fileType]
  const path = `${provider.id}/${randomUUID()}.${ext}`
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) return { error: 'No se pudo preparar la carga. Intenta de nuevo.' }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

export async function confirmMediaUpload(input: {
  path: string
  title?: string
}): Promise<{ media?: ProviderMedia; error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  if (!input.path.startsWith(`${provider.id}/`) || input.path.includes('..')) {
    return { error: 'No autorizado' }
  }

  const { data: info, error: infoError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .info(input.path)
  if (infoError || !info) return { error: 'El archivo no se encontró en Storage.' }

  const mime = info.contentType ?? ''
  const size = info.size ?? 0
  const kind = mediaTypeFor(mime)
  if (!kind || size === 0 || size > MAX_MEDIA_BYTES) {
    await supabase.storage.from(MEDIA_BUCKET).remove([input.path])
    return { error: 'El archivo subido no es un audio o video válido.' }
  }

  const { data: maxOrder } = await supabase
    .from('provider_media')
    .select('sort_order')
    .eq('provider_id', provider.id)
    .in('type', ['audio', 'video'])
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: media, error } = await supabase
    .from('provider_media')
    .insert({
      provider_id: provider.id,
      type: kind,
      bucket: MEDIA_BUCKET,
      path: input.path,
      url: publicMediaUrl(MEDIA_BUCKET, input.path),
      title: input.title?.trim().slice(0, 120) || null,
      mime_type: mime,
      size_bytes: size,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single<ProviderMedia>()

  if (error || !media) {
    await supabase.storage.from(MEDIA_BUCKET).remove([input.path])
    return { error: 'No se pudo registrar el archivo. Intenta de nuevo.' }
  }

  revalidatePath('/panel/media')
  return { media }
}

export async function deleteMedia(mediaId: string): Promise<{ error?: string }> {
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
  if (error) return { error: 'No se pudo eliminar el archivo.' }

  await supabase.storage.from(media.bucket).remove([media.path])
  revalidatePath('/panel/media')
  return {}
}

export async function updateMediaTitle(
  mediaId: string,
  title: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const provider = await getOwnedProvider(supabase)
  if (!provider) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('provider_media')
    .update({ title: title.trim().slice(0, 120) || null })
    .eq('id', mediaId)
    .eq('provider_id', provider.id)
  if (error) return { error: 'No se pudo guardar el título.' }

  revalidatePath('/panel/media')
  return {}
}
