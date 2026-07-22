'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { EVENT_TYPES, MENU_COURSES } from '@/lib/constants'
import type { CateringMenuWithItems } from '@/lib/types'
import { createMenu, updateMenu, deleteMenu, type State } from './_actions'
import { UtensilsIcon } from '@/components/icons'

export default function MenusManager({ menus }: { menus: CateringMenuWithItems[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleDelete(menu: CateringMenuWithItems) {
    if (!confirm(`¿Eliminar el menú "${menu.name}" y todos sus platillos?`)) return
    const res = await deleteMenu(menu.id)
    if (res.error) toast.error(res.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {menus.length === 0 && !creating && (
        <div className="bg-planneo-900 rounded-2xl border border-white/10 p-10 text-center">
          <div className="mb-3 flex justify-center text-planneo-300"><UtensilsIcon className="size-8" /></div>
          <p className="text-sm text-white/55">
            Aún no tienes menús. Un menú detallado ayuda al cliente a imaginar su evento.
          </p>
        </div>
      )}

      {menus.map((menu) =>
        editingId === menu.id ? (
          <div key={menu.id} className="bg-planneo-900 rounded-2xl border border-planneo-300/40 p-5">
            <MenuForm
              menu={menu}
              onDone={() => {
                setEditingId(null)
                router.refresh()
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div key={menu.id} className="bg-planneo-900 rounded-2xl border border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-white">{menu.name}</h2>
                  {menu.event_types?.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-medium bg-white/10 text-white/60 px-2 py-0.5 rounded-full"
                    >
                      {EVENT_TYPES.find((e) => e.value === t)?.label ?? t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-planneo-300 font-medium mt-0.5">{formatMenuPrice(menu)}</p>
                {menu.description && (
                  <p className="text-sm text-white/55 mt-1.5">{menu.description}</p>
                )}
                <MenuItemsSummary menu={menu} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setCreating(false); setEditingId(menu.id) }}
                  className="text-xs font-medium text-planneo-300 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(menu)}
                  className="text-xs font-medium text-red-300 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {creating ? (
        <div className="bg-planneo-900 rounded-2xl border border-planneo-300/40 p-5">
          <MenuForm
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
          className="rounded-2xl border-2 border-dashed border-white/15 hover:border-planneo-300 text-white/55 hover:text-planneo-300 transition-colors p-4 text-sm font-medium"
        >
          + Nuevo menú
        </button>
      )}
    </div>
  )
}

function itemsForCourse(menu: CateringMenuWithItems, courseValue: string) {
  return menu.catering_menu_items
    .filter((item) => item.course === courseValue)
    .sort((a, b) => a.sort_order - b.sort_order)
}

function MenuItemsSummary({ menu }: { menu: CateringMenuWithItems }) {
  const courses = MENU_COURSES.map((course) => ({
    label: course.label,
    items: itemsForCourse(menu, course.value),
  })).filter((c) => c.items.length > 0)

  if (courses.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {courses.map((course) => (
        <div key={course.label} className="text-xs text-white/60">
          <span className="font-medium text-white/75">{course.label}:</span>{' '}
          {course.items.map((item) => item.name).join(' · ')}
        </div>
      ))}
    </div>
  )
}

function MenuForm({
  menu,
  onDone,
  onCancel,
}: {
  menu?: CateringMenuWithItems
  onDone: () => void
  onCancel: () => void
}) {
  const action = menu ? updateMenu.bind(null, menu.id) : createMenu
  const [state, formAction, isPending] = useActionState<State, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      toast.success(menu ? 'Menú actualizado.' : 'Menú creado.')
      onDone()
    }
  }, [state.success, menu, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-white">
        {menu ? `Editar "${menu.name}"` : 'Nuevo menú'}
      </h2>

      {state.error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="menu-name">Nombre *</Label>
        <Input
          id="menu-name"
          name="name"
          required
          placeholder='Ej. "Menú Silver", "Menú Premium"'
          defaultValue={menu?.name ?? ''}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-red-300">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="menu-description">Descripción</Label>
        <Textarea
          id="menu-description"
          name="description"
          rows={2}
          defaultValue={menu?.description ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="menu-price">Precio por persona (MXN)</Label>
          <Input
            id="menu-price"
            name="price_per_person"
            type="number"
            min="0"
            step="0.01"
            defaultValue={menu?.price_per_person ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="menu-min-guests">Mínimo de invitados</Label>
          <Input
            id="menu-min-guests"
            name="min_guests"
            type="number"
            min="1"
            defaultValue={menu?.min_guests ?? ''}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-white mb-1">
          Tipos de evento para los que aplica
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {EVENT_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2 text-sm text-white/75 cursor-pointer"
            >
              <Checkbox
                name="event_types"
                value={type.value}
                defaultChecked={menu?.event_types?.includes(type.value) ?? false}
              />
              {type.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-white mb-1">
          Platillos por tiempo — uno por línea, con &quot;—&quot; para agregar descripción
        </legend>
        {MENU_COURSES.map((course) => (
          <div key={course.value} className="flex flex-col gap-1.5">
            <Label htmlFor={`menu-items-${course.value}`} className="text-xs text-white/60">
              {course.label}
            </Label>
            <Textarea
              id={`menu-items-${course.value}`}
              name={`items_${course.value}`}
              rows={2}
              placeholder={course.value === 'plato_principal' ? 'Filete en salsa de champiñones — con guarnición de temporada' : ''}
              defaultValue={
                menu
                  ? itemsForCourse(menu, course.value)
                      .map((item) =>
                        item.description ? `${item.name} — ${item.description}` : item.name
                      )
                      .join('\n')
                  : ''
              }
            />
          </div>
        ))}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : menu ? 'Guardar cambios' : 'Crear menú'}
        </Button>
      </div>
    </form>
  )
}

function formatMenuPrice(menu: CateringMenuWithItems): string {
  const parts: string[] = []
  if (menu.price_per_person) {
    parts.push(`$${menu.price_per_person.toLocaleString('es-MX')} por persona`)
  } else {
    parts.push('Precio a consultar')
  }
  if (menu.min_guests) parts.push(`mínimo ${menu.min_guests} invitados`)
  return parts.join(' · ')
}
