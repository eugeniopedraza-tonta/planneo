'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'
import type { Provider } from '@/lib/types'
import { updateMyProfile, type State } from './_actions'

type Props = {
  provider: Provider
}

export default function EditProfileForm({ provider }: Props) {
  const [state, formAction, isPending] = useActionState(updateMyProfile, {})

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          Perfil actualizado correctamente.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={provider.description ?? ''}
          placeholder="Describe brevemente tus servicios…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          placeholder="+52 81 XXXX XXXX"
          defaultValue={provider.whatsapp ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagram_handle">Instagram</Label>
        <Input
          id="instagram_handle"
          name="instagram_handle"
          placeholder="@usuario"
          defaultValue={provider.instagram_handle ?? ''}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price_range">Rango de precio</Label>
        <select
          id="price_range"
          name="price_range"
          defaultValue={provider.price_range ?? ''}
          className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm text-foreground"
        >
          <option value="">Sin especificar</option>
          {PRICE_RANGES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipos de evento</Label>
        <div className="flex flex-wrap gap-4">
          {EVENT_TYPES.map((et) => (
            <div key={et.value} className="flex items-center gap-2">
              <Checkbox
                id={`event_${et.value}`}
                name="event_types"
                value={et.value}
                defaultChecked={provider.event_types?.includes(et.value as never) ?? false}
              />
              <Label htmlFor={`event_${et.value}`} className="font-normal cursor-pointer">
                {et.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
