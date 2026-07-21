'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { VENUE_AMENITIES } from '@/lib/constants'
import type { VenueDetails } from '@/lib/types'
import { saveVenueDetails, type State } from './_actions'

export default function VenueForm({ details }: { details: VenueDetails | null }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<State, FormData>(saveVenueDetails, {})

  useEffect(() => {
    if (state.success) {
      toast.success('Detalles del salón guardados.')
      router.refresh()
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-5">
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venue-cap-min">Capacidad mínima (personas)</Label>
          <Input
            id="venue-cap-min"
            name="capacity_min"
            type="number"
            min="1"
            defaultValue={details?.capacity_min ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venue-cap-max">Capacidad máxima (personas)</Label>
          <Input
            id="venue-cap-max"
            name="capacity_max"
            type="number"
            min="1"
            defaultValue={details?.capacity_max ?? ''}
          />
          {state.fieldErrors?.capacity_max && (
            <p className="text-xs text-red-600">{state.fieldErrors.capacity_max[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venue-address">Dirección</Label>
        <Textarea
          id="venue-address"
          name="address"
          rows={2}
          placeholder="Calle, número, colonia, municipio"
          defaultValue={details?.address ?? ''}
        />
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-medium text-gray-900 mb-1">Espacio</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <Checkbox name="indoor" defaultChecked={details?.indoor ?? false} />
            Interior
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <Checkbox name="outdoor" defaultChecked={details?.outdoor ?? false} />
            Exterior
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <Checkbox name="parking" defaultChecked={details?.parking ?? false} />
            Estacionamiento propio
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <Checkbox name="catering_allowed" defaultChecked={details?.catering_allowed ?? false} />
            Permite catering externo
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-medium text-gray-900 mb-1">Amenidades</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {VENUE_AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <Checkbox
                name="amenities"
                value={amenity}
                defaultChecked={details?.amenities?.includes(amenity) ?? false}
              />
              {amenity}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar detalles'}
        </Button>
      </div>
    </form>
  )
}
