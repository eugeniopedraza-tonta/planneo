'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_MEDIA_ACCEPT,
  ALLOWED_VIDEO_TYPES,
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_PROVIDER,
} from '@/lib/media'
import { UploadCanceledError, uploadToSignedUrlWithProgress } from '@/lib/upload-client'
import type { ProviderMedia } from '@/lib/types'
import {
  confirmMediaUpload,
  deleteMedia,
  requestMediaUpload,
  updateMediaTitle,
} from './_actions'

type UploadStatus = 'subiendo' | 'confirmando' | 'error'

type UploadItem = {
  id: string
  file: File
  progress: number
  status: UploadStatus
  error?: string
  xhr?: XMLHttpRequest
}

export default function MediaManager({ initialMedia }: { initialMedia: ProviderMedia[] }) {
  const router = useRouter()
  const [media, setMedia] = useState(initialMedia)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // El servidor es la fuente de verdad tras cada revalidación.
  const [prevInitial, setPrevInitial] = useState(initialMedia)
  if (prevInitial !== initialMedia) {
    setPrevInitial(initialMedia)
    setMedia(initialMedia)
  }

  const patchUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      prev.find((u) => u.id === id)?.xhr?.abort()
      return prev.filter((u) => u.id !== id)
    })
  }, [])

  async function startUpload(item: UploadItem) {
    patchUpload(item.id, { status: 'subiendo', progress: 0, error: undefined })

    const ticket = await requestMediaUpload({
      fileType: item.file.type,
      fileSize: item.file.size,
    })
    if ('error' in ticket) {
      patchUpload(item.id, { status: 'error', error: ticket.error })
      return
    }

    try {
      await uploadToSignedUrlWithProgress({
        signedUrl: ticket.signedUrl,
        file: item.file,
        onProgress: (progress) => patchUpload(item.id, { progress }),
        onXhr: (xhr) => patchUpload(item.id, { xhr }),
      })
    } catch (err) {
      if (err instanceof UploadCanceledError) return
      patchUpload(item.id, {
        status: 'error',
        error: 'Falló la carga. Revisa tu conexión y reintenta.',
        xhr: undefined,
      })
      return
    }

    patchUpload(item.id, { status: 'confirmando', progress: 100, xhr: undefined })
    // Título inicial: el nombre del archivo sin extensión (editable después).
    const defaultTitle = item.file.name.replace(/\.[^.]+$/, '')
    const confirmed = await confirmMediaUpload({ path: ticket.path, title: defaultTitle })
    if (confirmed.error || !confirmed.media) {
      patchUpload(item.id, { status: 'error', error: confirmed.error ?? 'Error al registrar.' })
      return
    }

    setMedia((prev) => [...prev, confirmed.media!])
    removeUpload(item.id)
    router.refresh()
  }

  function addFiles(files: File[]) {
    const errors: string[] = []
    const accepted: UploadItem[] = []
    const pendingKeys = new Set(uploads.map((u) => `${u.file.name}:${u.file.size}`))

    for (const file of files) {
      if (!ALLOWED_AUDIO_TYPES[file.type] && !ALLOWED_VIDEO_TYPES[file.type]) {
        errors.push(`${file.name}: formato no permitido (MP3, M4A, WAV o MP4).`)
        continue
      }
      if (file.size > MAX_MEDIA_BYTES) {
        errors.push(`${file.name}: supera ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)}MB.`)
        continue
      }
      const key = `${file.name}:${file.size}`
      if (pendingKeys.has(key)) continue
      pendingKeys.add(key)
      accepted.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'subiendo',
      })
    }

    const slots = MAX_MEDIA_PER_PROVIDER - media.length - uploads.length
    if (accepted.length > slots) {
      errors.push(`Solo puedes subir ${Math.max(slots, 0)} archivo(s) más.`)
      accepted.splice(Math.max(slots, 0))
    }

    errors.forEach((e) => toast.error(e))
    if (!accepted.length) return
    setUploads((prev) => [...prev, ...accepted])
    accepted.forEach((item) => void startUpload(item))
  }

  async function handleDelete(item: ProviderMedia) {
    if (!confirm(`¿Eliminar "${item.title ?? 'este archivo'}" definitivamente?`)) return
    const prev = media
    setMedia((m) => m.filter((x) => x.id !== item.id))
    const res = await deleteMedia(item.id)
    if (res.error) {
      setMedia(prev)
      toast.error(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleTitleBlur(item: ProviderMedia, value: string) {
    if ((item.title ?? '') === value.trim()) return
    const res = await updateMediaTitle(item.id, value)
    if (res.error) toast.error(res.error)
  }

  const full = media.length + uploads.length >= MAX_MEDIA_PER_PROVIDER

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-gray-300 bg-white'
        }`}
      >
        <p className="text-sm text-gray-600">
          Arrastra tus archivos aquí o{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={full}
            className="font-medium text-[#7C3AED] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            selecciónalos
          </button>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          MP3, M4A, WAV o MP4 · máx. {Math.round(MAX_MEDIA_BYTES / 1024 / 1024)}MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MEDIA_ACCEPT}
          multiple
          className="hidden"
          aria-label="Seleccionar archivos de audio o video"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Cargas en curso">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3"
            >
              <span className="size-10 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-lg shrink-0">
                {u.file.type.startsWith('video/') ? '🎬' : '🎵'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{u.file.name}</p>
                {u.status === 'error' ? (
                  <p className="text-xs text-red-600 mt-0.5">{u.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={u.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full bg-[#7C3AED] transition-[width] duration-200"
                      style={{ width: `${u.status === 'confirmando' ? 100 : u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 w-20 text-right shrink-0">
                {u.status === 'subiendo' && `${u.progress}%`}
                {u.status === 'confirmando' && 'Guardando…'}
              </span>
              {u.status === 'error' && (
                <button
                  type="button"
                  onClick={() => void startUpload(u)}
                  className="text-xs font-medium text-[#7C3AED] hover:underline shrink-0"
                >
                  Reintentar
                </button>
              )}
              <button
                type="button"
                onClick={() => removeUpload(u.id)}
                aria-label={`Cancelar carga de ${u.file.name}`}
                className="text-gray-400 hover:text-gray-600 shrink-0 px-1"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {media.length === 0 && uploads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">🎵</p>
          <p className="text-sm text-gray-500">
            Aún no tienes archivos. Los músicos y DJs con demos reciben más consultas.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Archivos de audio y video">
          {media.map((item) => (
            <li key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  defaultValue={item.title ?? ''}
                  placeholder="Título descriptivo…"
                  maxLength={120}
                  aria-label="Título del archivo"
                  onBlur={(e) => void handleTitleBlur(item, e.target.value)}
                  className="flex-1 text-sm font-medium border border-transparent hover:border-gray-200 focus:border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <span className="text-xs text-gray-400 shrink-0">
                  {formatSize(item.size_bytes)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="text-xs font-medium text-red-500 hover:underline shrink-0"
                >
                  Eliminar
                </button>
              </div>
              {item.type === 'audio' ? (
                <audio controls preload="metadata" src={item.url} className="w-full h-10" />
              ) : (
                <video controls preload="metadata" src={item.url} className="w-full max-h-64 rounded-lg bg-black" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
