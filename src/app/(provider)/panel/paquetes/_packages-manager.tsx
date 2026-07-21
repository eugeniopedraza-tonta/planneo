'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { PRICE_UNITS } from '@/lib/constants'
import type { ServicePackage } from '@/lib/types'
import { createPackage, updatePackage, deletePackage, type State } from './_actions'

export default function PackagesManager({ packages }: { packages: ServicePackage[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleDelete(pkg: ServicePackage) {
    if (!confirm(`¿Eliminar el paquete "${pkg.name}"?`)) return
    const res = await deletePackage(pkg.id)
    if (res.error) toast.error(res.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {packages.length === 0 && !creating && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm text-gray-500">
            Aún no tienes paquetes. Los perfiles con precios claros generan más confianza.
          </p>
        </div>
      )}

      {packages.map((pkg) =>
        editingId === pkg.id ? (
          <div key={pkg.id} className="bg-white rounded-2xl border border-[#7C3AED]/30 p-5">
            <PackageForm
              pkg={pkg}
              onDone={() => {
                setEditingId(null)
                router.refresh()
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div key={pkg.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-gray-900">{pkg.name}</h2>
                  {pkg.is_featured && (
                    <span className="text-[11px] font-medium bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full">
                      Destacado
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#7C3AED] font-medium mt-0.5">{formatPrice(pkg)}</p>
                {pkg.description && (
                  <p className="text-sm text-gray-500 mt-1.5">{pkg.description}</p>
                )}
                {(pkg.includes?.length ?? 0) > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {pkg.includes!.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-[#7C3AED] mt-px">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setCreating(false); setEditingId(pkg.id) }}
                  className="text-xs font-medium text-[#7C3AED] hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(pkg)}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {creating ? (
        <div className="bg-white rounded-2xl border border-[#7C3AED]/30 p-5">
          <PackageForm
            onDone={() => {
              setCreating(false)
              router.refresh()
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setEditingId(null); setCreating(true) }}
          className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#7C3AED] text-gray-500 hover:text-[#7C3AED] transition-colors p-4 text-sm font-medium"
        >
          + Nuevo paquete
        </button>
      )}
    </div>
  )
}

function PackageForm({
  pkg,
  onDone,
  onCancel,
}: {
  pkg?: ServicePackage
  onDone: () => void
  onCancel: () => void
}) {
  const action = pkg ? updatePackage.bind(null, pkg.id) : createPackage
  const [state, formAction, isPending] = useActionState<State, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      toast.success(pkg ? 'Paquete actualizado.' : 'Paquete creado.')
      onDone()
    }
  }, [state.success, pkg, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {pkg ? `Editar "${pkg.name}"` : 'Nuevo paquete'}
      </h2>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pkg-name">Nombre *</Label>
        <Input
          id="pkg-name"
          name="name"
          required
          placeholder='Ej. "Paquete Silver", "Cobertura básica"'
          defaultValue={pkg?.name ?? ''}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pkg-description">Descripción</Label>
        <Textarea
          id="pkg-description"
          name="description"
          rows={2}
          defaultValue={pkg?.description ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pkg-price-from">Precio desde (MXN)</Label>
          <Input
            id="pkg-price-from"
            name="price_from"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg?.price_from ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pkg-price-to">Hasta (opcional)</Label>
          <Input
            id="pkg-price-to"
            name="price_to"
            type="number"
            min="0"
            step="0.01"
            defaultValue={pkg?.price_to ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pkg-price-unit">Unidad</Label>
          <select
            id="pkg-price-unit"
            name="price_unit"
            defaultValue={pkg?.price_unit ?? ''}
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm text-foreground"
          >
            <option value="">Sin especificar</option>
            {PRICE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pkg-includes">Qué incluye (uno por línea)</Label>
        <Textarea
          id="pkg-includes"
          name="includes"
          rows={4}
          placeholder={'6 horas de cobertura\n300 fotos editadas\nÁlbum digital'}
          defaultValue={pkg?.includes?.join('\n') ?? ''}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="pkg-featured"
          name="is_featured"
          defaultChecked={pkg?.is_featured ?? false}
        />
        <Label htmlFor="pkg-featured" className="font-normal cursor-pointer">
          Destacar este paquete en mi perfil
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : pkg ? 'Guardar cambios' : 'Crear paquete'}
        </Button>
      </div>
    </form>
  )
}

function formatPrice(pkg: ServicePackage): string {
  const unit = PRICE_UNITS.find((u) => u.value === pkg.price_unit)?.label.toLowerCase() ?? ''
  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`
  if (pkg.price_from && pkg.price_to) return `${fmt(pkg.price_from)} – ${fmt(pkg.price_to)} ${unit}`.trim()
  if (pkg.price_from) return `Desde ${fmt(pkg.price_from)} ${unit}`.trim()
  return 'Precio a consultar'
}
