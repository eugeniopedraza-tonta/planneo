'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { withCatalogQuery, type CatalogQuery } from '@/lib/catalog-href'

type Option = { value: string; label: string }

type Draft = {
  q: string
  zona: string
  evento: string
  precio: string
  fecha: string
}

const DRAFT_KEYS = ['q', 'zona', 'evento', 'precio', 'fecha'] as const satisfies readonly (keyof Draft)[]

const COUNT_DEBOUNCE_MS = 300

function toDraft(query: CatalogQuery): Draft {
  return {
    q: query.q ?? '',
    zona: query.zona ?? '',
    evento: query.evento ?? '',
    precio: query.precio ?? '',
    fecha: query.fecha ?? '',
  }
}

const EMPTY_DRAFT: Draft = toDraft({})

function draftKey(draft: Draft) {
  return DRAFT_KEYS.map((key) => draft[key].trim()).join('|')
}

/**
 * Filtros del catálogo. La URL sigue siendo la fuente de verdad: lo que se
 * edita aquí es un borrador que solo se aplica con "Ver resultados (N)".
 * - ≥768px: formulario en la columna lateral, como antes, con el conteo en el botón.
 * - <768px: botón "Filtros (n)" que abre una hoja inferior con los mismos controles.
 *   Cerrarla sin aplicar descarta el borrador.
 *
 * El padre la monta con `key` = filtros aplicados, así que tras navegar se
 * reinicia con los valores nuevos. Sin JS, el `<form method="get">` funciona igual.
 */
export default function CatalogFilters({
  action,
  categorySlug,
  applied,
  appliedCount,
  clearHref,
  zonas,
  eventos,
  precios,
}: {
  /** Ruta a la que se aplican los filtros (`/{categoria}`, `/buscar`, `/proveedores`). */
  action: string
  /** Categoría vigente (de la ruta o de `?categoria=`); acota el conteo. */
  categorySlug?: string
  applied: CatalogQuery
  /** Resultados de los filtros aplicados (lo que ya muestra la página). */
  appliedCount: number
  clearHref: string
  zonas: Option[]
  eventos: Option[]
  precios: Option[]
}) {
  const router = useRouter()
  const initialDraft = toDraft(applied)
  const appliedKey = draftKey(initialDraft)

  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [open, setOpen] = useState(false)
  const [fetched, setFetched] = useState<{ key: string; count: number } | null>(null)

  const currentKey = draftKey(draft)
  const isDirty = currentKey !== appliedKey

  // Conteo en vivo del borrador. Solo pega a la API cuando difiere de lo aplicado.
  useEffect(() => {
    if (!isDirty) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams()
      for (const key of DRAFT_KEYS) {
        const value = draft[key].trim()
        if (value) params.set(key, value)
      }
      if (applied.sub) params.set('sub', applied.sub)
      if (categorySlug) params.set('categoria', categorySlug)
      fetch(`/api/providers/count?${params.toString()}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((body: { count?: number } | null) => {
          if (typeof body?.count === 'number') setFetched({ key: currentKey, count: body.count })
        })
        .catch(() => {})
    }, COUNT_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [applied.sub, categorySlug, currentKey, draft, isDirty])

  const count: number | null = !isDirty
    ? appliedCount
    : fetched?.key === currentKey
      ? fetched.count
      : null

  const activeCount = DRAFT_KEYS.filter((key) => Boolean(applied[key]?.trim())).length
  const hasApplied = activeCount > 0 || Boolean(applied.sub)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: CatalogQuery = { sub: applied.sub }
    for (const key of DRAFT_KEYS) {
      const value = draft[key].trim()
      if (value) next[key] = value
    }
    setOpen(false)
    router.push(withCatalogQuery(action, next, true))
  }

  function clear() {
    if (hasApplied) {
      setOpen(false)
      router.push(clearHref)
    } else {
      setDraft(EMPTY_DRAFT)
    }
  }

  function handleOpenChange(next: boolean) {
    // Abrir o cerrar sin aplicar: el borrador vuelve a lo que dice la URL.
    setDraft(initialDraft)
    setOpen(next)
  }

  const submitLabel = `Ver resultados (${count ?? '…'})`
  const canClear = hasApplied || currentKey !== draftKey(EMPTY_DRAFT)

  return (
    <>
      {/* Desktop / tablet: formulario lateral como antes. */}
      <form
        action={action}
        method="get"
        onSubmit={apply}
        className="sticky top-24 hidden space-y-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 md:block"
      >
        <p className="text-sm font-semibold text-white">Afinar búsqueda</p>
        {applied.sub && <input type="hidden" name="sub" value={applied.sub} />}
        <FilterFields idPrefix="catalog" draft={draft} setDraft={setDraft} zonas={zonas} eventos={eventos} precios={precios} />
        <button
          type="submit"
          aria-busy={count === null}
          className="min-h-11 w-full rounded-xl bg-planneo-600 font-semibold text-white transition hover:bg-planneo-500"
        >
          {submitLabel}
        </button>
        {hasApplied && (
          <Link
            href={clearHref}
            className="block text-center text-sm font-medium text-white/55 transition hover:text-white"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      {/* Móvil: botón + hoja inferior. */}
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 md:hidden"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
          </button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[28px] border-t border-white/10 bg-planneo-900 text-planneo-ink shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.7)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom md:hidden"
          >
            <form action={action} method="get" onSubmit={apply} className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <DialogPrimitive.Title className="text-base font-semibold text-white">Filtros</DialogPrimitive.Title>
                <DialogPrimitive.Close
                  className="-mr-2 flex size-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-planneo-300"
                  aria-label="Cerrar filtros"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </DialogPrimitive.Close>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-3">
                {applied.sub && <input type="hidden" name="sub" value={applied.sub} />}
                <FilterFields idPrefix="catalog-sheet" draft={draft} setDraft={setDraft} zonas={zonas} eventos={eventos} precios={precios} />
              </div>
              <div className="flex items-center gap-3 border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                <button
                  type="button"
                  onClick={clear}
                  disabled={!canClear}
                  className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-white/65 transition hover:text-white disabled:opacity-40"
                >
                  Limpiar filtros
                </button>
                <button
                  type="submit"
                  aria-busy={count === null}
                  className="min-h-11 flex-1 rounded-xl bg-planneo-600 font-semibold text-white transition hover:bg-planneo-500"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

function FilterFields({
  idPrefix,
  draft,
  setDraft,
  zonas,
  eventos,
  precios,
}: {
  idPrefix: string
  draft: Draft
  setDraft: (update: (prev: Draft) => Draft) => void
  zonas: Option[]
  eventos: Option[]
  precios: Option[]
}) {
  const set = (key: keyof Draft) => (value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-q`} className="mb-1.5 block text-sm font-medium text-white/75">
          Buscar
        </label>
        <input
          id={`${idPrefix}-q`}
          type="search"
          name="q"
          value={draft.q}
          onChange={(event) => set('q')(event.target.value)}
          placeholder="Fotografía, DJ, catering..."
          className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-planneo-300"
        />
      </div>
      <Select id={`${idPrefix}-zona`} label="Zona" name="zona" value={draft.zona} onChange={set('zona')} options={zonas} />
      <Select id={`${idPrefix}-evento`} label="Tipo de evento" name="evento" value={draft.evento} onChange={set('evento')} options={eventos} />
      <Select id={`${idPrefix}-precio`} label="Precio" name="precio" value={draft.precio} onChange={set('precio')} options={precios} />
      <div>
        <label htmlFor={`${idPrefix}-fecha`} className="mb-1.5 block text-sm font-medium text-white/75">
          Fecha
        </label>
        <input
          id={`${idPrefix}-fecha`}
          type="date"
          name="fecha"
          value={draft.fecha}
          onChange={(event) => set('fecha')(event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-planneo-300"
        />
      </div>
    </>
  )
}

function Select({
  id,
  label,
  name,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Option[]
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/75">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#211A30] px-3 text-sm text-white outline-none focus:border-planneo-300"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
