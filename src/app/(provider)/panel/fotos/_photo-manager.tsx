'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CameraIcon } from '@/components/icons'
import {
  ALLOWED_IMAGE_ACCEPT,
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_PROVIDER,
} from '@/lib/media'
import { UploadCanceledError, uploadToSignedUrlWithProgress } from '@/lib/upload-client'
import type { ProviderMedia } from '@/lib/types'
import {
  confirmPhotoUpload,
  deletePhoto,
  reorderPhotos,
  requestPhotoUpload,
  updatePhotoAlt,
} from './_actions'

type UploadStatus = 'subiendo' | 'confirmando' | 'error'

type UploadItem = {
  id: string
  file: File
  previewUrl: string
  progress: number
  status: UploadStatus
  error?: string
  xhr?: XMLHttpRequest
}

export default function PhotoManager({ initialPhotos }: { initialPhotos: ProviderMedia[] }) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // El servidor es la fuente de verdad tras cada revalidación.
  const [prevInitial, setPrevInitial] = useState(initialPhotos)
  if (prevInitial !== initialPhotos) {
    setPrevInitial(initialPhotos)
    setPhotos(initialPhotos)
  }

  useEffect(() => {
    return () => uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl))
    // Solo al desmontar: las previews activas se revocan al terminar cada carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patchUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id)
      if (item) {
        item.xhr?.abort()
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter((u) => u.id !== id)
    })
  }, [])

  async function startUpload(item: UploadItem) {
    patchUpload(item.id, { status: 'subiendo', progress: 0, error: undefined })

    const ticket = await requestPhotoUpload({
      fileType: item.file.type,
      fileSize: item.file.size,
    })
    if ('error' in ticket) {
      patchUpload(item.id, { status: 'error', error: ticket.error })
      return
    }

    // Carga directa navegador → Storage (PUT firmado); el archivo no pasa por Next.js.
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
    const confirmed = await confirmPhotoUpload({ path: ticket.path })
    if (confirmed.error || !confirmed.media) {
      patchUpload(item.id, { status: 'error', error: confirmed.error ?? 'Error al registrar.' })
      return
    }

    setPhotos((prev) => [...prev, confirmed.media!])
    removeUpload(item.id)
    router.refresh()
  }

  function addFiles(files: File[]) {
    const errors: string[] = []
    const accepted: UploadItem[] = []
    const pendingKeys = new Set(uploads.map((u) => `${u.file.name}:${u.file.size}`))

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES[file.type]) {
        errors.push(`${file.name}: formato no permitido (JPEG, PNG, WebP o AVIF).`)
        continue
      }
      if (file.size > MAX_PHOTO_BYTES) {
        errors.push(`${file.name}: supera ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB.`)
        continue
      }
      const key = `${file.name}:${file.size}`
      if (pendingKeys.has(key)) continue // evita envíos duplicados
      pendingKeys.add(key)
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'subiendo',
      })
    }

    const slots = MAX_PHOTOS_PER_PROVIDER - photos.length - uploads.length
    if (accepted.length > slots) {
      errors.push(`Solo puedes subir ${Math.max(slots, 0)} foto(s) más.`)
      accepted.splice(Math.max(slots, 0))
    }

    errors.forEach((e) => toast.error(e))
    if (!accepted.length) return
    setUploads((prev) => [...prev, ...accepted])
    accepted.forEach((item) => void startUpload(item))
  }

  async function handleDelete(media: ProviderMedia) {
    if (!confirm('¿Eliminar esta foto definitivamente?')) return
    const prev = photos
    setPhotos((p) => p.filter((m) => m.id !== media.id))
    const res = await deletePhoto(media.id)
    if (res.error) {
      setPhotos(prev)
      toast.error(res.error)
    } else {
      router.refresh()
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    await applyOrder(next)
  }

  async function makePrimary(index: number) {
    if (index === 0) return
    const next = [...photos]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    await applyOrder(next)
  }

  async function applyOrder(next: ProviderMedia[]) {
    const prev = photos
    setPhotos(next)
    setSavingOrder(true)
    const res = await reorderPhotos(next.map((m) => m.id))
    setSavingOrder(false)
    if (res.error) {
      setPhotos(prev)
      toast.error(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleAltBlur(media: ProviderMedia, value: string) {
    if ((media.alt_text ?? '') === value.trim()) return
    const res = await updatePhotoAlt(media.id, value)
    if (res.error) toast.error(res.error)
  }

  const full = photos.length + uploads.length >= MAX_PHOTOS_PER_PROVIDER

  return (
    <div className="flex flex-col gap-6">
      {/* Zona de carga */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-planneo-300 bg-planneo-600/10' : 'border-white/15 bg-planneo-900'
        }`}
      >
        <p className="text-sm text-white/60">
          Arrastra tus fotos aquí o{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={full}
            className="font-medium text-planneo-300 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            selecciónalas
          </button>
        </p>
        <p className="text-xs text-white/50 mt-1">
          JPEG, PNG, WebP o AVIF · máx. {Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB por foto
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          multiple
          className="hidden"
          aria-label="Seleccionar fotos"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {/* Cargas en curso */}
      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Cargas en curso">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 bg-planneo-900 rounded-2xl border border-white/10 p-3"
            >
              {/* Vista previa local (blob:) — next/image no aplica aquí */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.previewUrl}
                alt=""
                className="size-12 rounded-lg object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 truncate">{u.file.name}</p>
                {u.status === 'error' ? (
                  <p className="text-xs text-red-300 mt-0.5">{u.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      role="progressbar"
                      aria-valuenow={u.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full bg-planneo-600 transition-[width] duration-200"
                      style={{ width: `${u.status === 'confirmando' ? 100 : u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-white/50 w-20 text-right shrink-0">
                {u.status === 'subiendo' && `${u.progress}%`}
                {u.status === 'confirmando' && 'Guardando…'}
              </span>
              {u.status === 'error' && (
                <button
                  type="button"
                  onClick={() => void startUpload(u)}
                  className="text-xs font-medium text-planneo-300 hover:underline shrink-0"
                >
                  Reintentar
                </button>
              )}
              <button
                type="button"
                onClick={() => removeUpload(u.id)}
                aria-label={`Cancelar carga de ${u.file.name}`}
                className="text-white/50 hover:text-white/80 shrink-0 px-1"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Galería */}
      {photos.length === 0 && uploads.length === 0 ? (
        <div className="bg-planneo-900 rounded-2xl border border-white/10 p-10 text-center">
          <div className="mb-3 flex justify-center text-planneo-300"><CameraIcon className="size-8" /></div>
          <p className="text-sm text-white/55">
            Aún no tienes fotos. Los perfiles con fotos reciben muchas más consultas.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4" aria-label="Galería de fotos">
          {photos.map((media, index) => (
            <li
              key={media.id}
              className="bg-planneo-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-white/[0.04]">
                <Image
                  src={media.url}
                  alt={media.alt_text ?? `Foto ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 text-[11px] font-medium bg-planneo-600 text-white px-2 py-0.5 rounded-full">
                    Principal
                  </span>
                )}
              </div>
              <div className="p-2.5 flex flex-col gap-2">
                <input
                  type="text"
                  defaultValue={media.alt_text ?? ''}
                  placeholder="Texto alternativo…"
                  maxLength={300}
                  aria-label={`Texto alternativo de la foto ${index + 1}`}
                  onBlur={(e) => void handleAltBlur(media, e.target.value)}
                  className="w-full text-xs border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-planneo-300/40"
                />
                <div className="flex items-center gap-1">
                  <IconButton
                    label={`Mover foto ${index + 1} hacia atrás`}
                    disabled={index === 0 || savingOrder}
                    onClick={() => void move(index, -1)}
                  >
                    ←
                  </IconButton>
                  <IconButton
                    label={`Mover foto ${index + 1} hacia adelante`}
                    disabled={index === photos.length - 1 || savingOrder}
                    onClick={() => void move(index, 1)}
                  >
                    →
                  </IconButton>
                  {index !== 0 && (
                    <button
                      type="button"
                      disabled={savingOrder}
                      onClick={() => void makePrimary(index)}
                      className="text-[11px] font-medium text-planneo-300 hover:underline disabled:opacity-50 ml-1"
                    >
                      Hacer principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(media)}
                    aria-label={`Eliminar foto ${index + 1}`}
                    className="ml-auto text-[11px] font-medium text-red-300 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="size-7 rounded-lg border border-white/10 text-white/55 text-sm hover:bg-white/[0.07] disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
