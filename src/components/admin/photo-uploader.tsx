'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Props = {
  providerId?: string
  initialPhotos?: string[]
  onPhotosChange: (urls: string[]) => void
}

export default function PhotoUploader({ providerId, initialPhotos = [], onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${providerId ?? 'new'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('provider-photos')
        .upload(path, file, { upsert: true })

      if (!error) {
        const { data } = supabase.storage.from('provider-photos').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }

    const updated = [...photos, ...newUrls]
    setPhotos(updated)
    onPhotosChange(updated)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removePhoto(url: string) {
    const updated = photos.filter((p) => p !== url)
    setPhotos(updated)
    onPhotosChange(updated)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="relative size-20 rounded-lg overflow-hidden border border-gray-200 group">
            <Image src={url} alt="foto proveedor" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium"
            >
              Quitar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="size-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#7C3AED] text-gray-400 hover:text-[#7C3AED] transition-colors flex flex-col items-center justify-center gap-1 text-xs disabled:opacity-50"
        >
          {uploading ? (
            <span>…</span>
          ) : (
            <>
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Foto
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}
