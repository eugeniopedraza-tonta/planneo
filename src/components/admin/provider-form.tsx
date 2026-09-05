'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ZONAS_MTY, EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'
import { MAX_PROVIDER_TESTIMONIALS, normalizeTestimonials } from '@/lib/testimonials'
import type { Category, Provider } from '@/lib/types'
import type { ProviderActionState } from '@/app/admin/proveedores/_actions'
import PhotoUploader from './photo-uploader'

type Props = {
  categories: Category[]
  action: (prev: ProviderActionState, formData: FormData) => Promise<ProviderActionState>
  defaultValues?: Provider
}

export default function ProviderForm({ categories, action, defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, {})
  const [photos, setPhotos] = useState<string[]>(defaultValues?.photos ?? [])

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name ?? ''}
            aria-invalid={!!state.fieldErrors?.name}
            required
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-300">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">Categoría *</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={defaultValues?.category_id ?? ''}
            required
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm text-foreground"
          >
            <option value="">Seleccionar…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {state.fieldErrors?.category_id && (
            <p className="text-xs text-red-300">{state.fieldErrors.category_id[0]}</p>
          )}
        </div>

        {/* Zona */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zona">Zona *</Label>
          <select
            id="zona"
            name="zona"
            defaultValue={defaultValues?.zona ?? ''}
            required
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm text-foreground"
          >
            <option value="">Seleccionar…</option>
            {ZONAS_MTY.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          {state.fieldErrors?.zona && (
            <p className="text-xs text-red-300">{state.fieldErrors.zona[0]}</p>
          )}
        </div>

        {/* Número celular */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Número celular</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="+52 81 XXXX XXXX"
            defaultValue={defaultValues?.phone ?? ''}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ''}
            aria-invalid={!!state.fieldErrors?.email}
          />
          {state.fieldErrors?.email && (
            <p className="text-xs text-red-300">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Instagram */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram_handle">Instagram</Label>
          <Input
            id="instagram_handle"
            name="instagram_handle"
            placeholder="@usuario"
            defaultValue={defaultValues?.instagram_handle ?? ''}
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birth_date">Fecha de nacimiento</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={defaultValues?.birth_date ?? ''}
          />
        </div>

        {/* Precio */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_range">Rango de precio</Label>
          <select
            id="price_range"
            name="price_range"
            defaultValue={defaultValues?.price_range ?? ''}
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm text-foreground"
          >
            <option value="">Sin especificar</option>
            {PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ''}
            placeholder="Describe brevemente los servicios del proveedor…"
          />
        </div>

        {/* Tipos de evento */}
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Tipos de evento</Label>
          <div className="flex flex-wrap gap-4">
            {EVENT_TYPES.map((et) => (
              <div key={et.value} className="flex items-center gap-2">
                <Checkbox
                  id={`event_${et.value}`}
                  name="event_types"
                  value={et.value}
                  defaultChecked={defaultValues?.event_types?.includes(et.value as never) ?? false}
                />
                <Label htmlFor={`event_${et.value}`} className="font-normal cursor-pointer">
                  {et.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Fotos */}
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Fotos</Label>
          <PhotoUploader
            providerId={defaultValues?.id}
            initialPhotos={defaultValues?.photos ?? []}
            onPhotosChange={setPhotos}
          />
          <input type="hidden" name="photos" value={JSON.stringify(photos)} />
        </div>

        <TestimonialsFields defaultValues={defaultValues} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : (defaultValues ? 'Guardar cambios' : 'Crear proveedor')}
        </Button>
      </div>
    </form>
  )
}

function TestimonialsFields({ defaultValues }: { defaultValues?: Provider }) {
  const slots = Array.from({ length: MAX_PROVIDER_TESTIMONIALS }, (_, i) => {
    const existing = normalizeTestimonials(defaultValues?.testimonials)[i]
    return { quote: existing?.quote ?? '', author: existing?.author ?? '' }
  })

  return (
    <div className="col-span-2 flex flex-col gap-3">
      <div>
        <Label>Testimonios</Label>
        <p className="mt-1 text-xs text-white/55">
          Citas que aparecen en el perfil público. El autor es opcional (ej. Ana · boda 2025).
          Las citas vacías se ignoran.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3"
          >
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor={`testimonial_quote_${i}`}>Cita {i + 1}</Label>
              <Textarea
                id={`testimonial_quote_${i}`}
                name={`testimonial_quote_${i}`}
                rows={2}
                maxLength={500}
                defaultValue={slot.quote}
                placeholder="Fueron impecables el día de la boda…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`testimonial_author_${i}`}>Autor</Label>
              <Input
                id={`testimonial_author_${i}`}
                name={`testimonial_author_${i}`}
                maxLength={80}
                defaultValue={slot.author}
                placeholder="Ana · boda 2025"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
