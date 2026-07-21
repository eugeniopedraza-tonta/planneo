/**
 * Reglas compartidas (cliente y servidor) para archivos multimedia.
 * El servidor SIEMPRE revalida: lo del cliente es solo UX temprana.
 */

export const PHOTOS_BUCKET = 'provider-photos'
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // debe coincidir con el bucket
export const MAX_PHOTOS_PER_PROVIDER = 20

/** Formatos permitidos: MIME → extensión canónica. Sin SVG (no hay sanitización). */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const ALLOWED_IMAGE_ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(',')

export const MEDIA_BUCKET = 'provider-media'
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024 // debe coincidir con el bucket
export const MAX_MEDIA_PER_PROVIDER = 10

/** Audio/video permitidos: MIME → extensión canónica (igual que el bucket). */
export const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
}

export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
}

export const ALLOWED_MEDIA_ACCEPT = [
  ...Object.keys(ALLOWED_AUDIO_TYPES),
  ...Object.keys(ALLOWED_VIDEO_TYPES),
].join(',')

/** URL pública estable de un objeto en un bucket público (no expira). */
export function publicMediaUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
