'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { startProviderRegistration, requestExistingProfileAccess, type State } from './_actions'
import CategoryIcon from '@/components/category-icon'
import type { Category } from '@/lib/types'

type Props = {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  zonas: string[]
}

export default function RegisterForm({ categories, zonas }: Props) {
  const [state, formAction, isPending] = useActionState(startProviderRegistration, {} as State)

  // Se conserva lo escrito para poder reenviarlo tras ver un posible duplicado.
  const [businessName, setBusinessName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [zona, setZona] = useState('')
  const [email, setEmail] = useState('')

  if (state.duplicate) {
    return (
      <DuplicateStep
        duplicate={state.duplicate}
        email={email}
        onContinue={() => {
          const form = document.getElementById('register-form') as HTMLFormElement | null
          const skip = document.getElementById('skip-duplicate') as HTMLInputElement | null
          if (skip) skip.value = '1'
          form?.requestSubmit()
        }}
        hiddenForm={
          <form id="register-form" action={formAction} className="hidden">
            <input type="hidden" name="business_name" value={businessName} />
            <input type="hidden" name="category_id" value={categoryId} />
            <input type="hidden" name="zona" value={zona} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" id="skip-duplicate" name="skip_duplicate" value="0" />
          </form>
        }
      />
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <input type="hidden" name="skip_duplicate" value="0" />

      <Field label="Nombre del negocio" error={state.fieldErrors?.business_name}>
        <input
          name="business_name"
          required
          maxLength={120}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Estudio Foto Luna, DJ Marcos…"
          className={inputCls}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-white/75">Servicio principal</legend>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const active = categoryId === c.id
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm transition-colors ${
                  active
                    ? 'border-planneo-300 bg-planneo-600/20 text-white'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name="category_id"
                  value={c.id}
                  required
                  checked={active}
                  onChange={() => setCategoryId(c.id)}
                  className="sr-only"
                />
                <CategoryIcon
                  slug={c.slug}
                  className={`size-5 shrink-0 transition-colors ${
                    active ? 'text-planneo-300' : 'text-white/40'
                  }`}
                />
                <span>{c.name}</span>
              </label>
            )
          })}
        </div>
        {state.fieldErrors?.category_id?.[0] && (
          <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.category_id[0]}</p>
        )}
      </fieldset>

      <Field label="Zona donde atiendes más seguido" error={state.fieldErrors?.zona}>
        <select
          name="zona"
          required
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className={inputCls}
        >
          <option value="" disabled>Elige una zona</option>
          {zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Email de acceso"
        error={state.fieldErrors?.email}
        hint="Te enviaremos un código. No necesitas contraseña."
      >
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className={inputCls}
        />
      </Field>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
        >
          {isPending ? 'Enviando código…' : 'Crear mi borrador'}
        </button>
        <p className="mt-2 text-center text-xs text-white/45">
          Podrás revisar y publicar tu perfil cuando esté listo.
        </p>
      </div>

      <p className="text-center text-xs text-white/35">
        Al continuar aceptas los{' '}
        <Link href="/terminos" className="underline hover:text-white/60">Términos de uso</Link> y la{' '}
        <Link href="/privacidad" className="underline hover:text-white/60">Política de privacidad</Link>.
      </p>
    </form>
  )
}

function DuplicateStep({
  duplicate,
  email,
  onContinue,
  hiddenForm,
}: {
  duplicate: NonNullable<State['duplicate']>
  email: string
  onContinue: () => void
  hiddenForm: React.ReactNode
}) {
  const [state, formAction, isPending] = useActionState(requestExistingProfileAccess, {} as State)

  if (state.claimRequested) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Solicitud enviada</h2>
        <p className="mt-2 text-sm text-white/60">
          Vamos a verificar que el negocio es tuyo y te enviaremos un enlace para activarlo a{' '}
          <span className="font-medium text-white/85">{email}</span>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm text-white/75 hover:border-white/30"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">¿Ya tienes un perfil en Planneo?</h2>
        <p className="mt-1 text-sm text-white/60">
          Encontramos un perfil parecido. Revísalo para evitar duplicados.
        </p>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-planneo-600/20">
          {duplicate.photo && (
            <Image src={duplicate.photo} alt={duplicate.name} fill className="object-cover" sizes="64px" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{duplicate.name}</p>
          <p className="truncate text-xs text-white/55">
            {[duplicate.categoryName, duplicate.zona].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="provider_id" value={duplicate.id} />
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500 disabled:opacity-60"
        >
          {isPending ? 'Enviando…' : 'Sí, quiero reclamar este perfil'}
        </button>
      </form>

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white/75 transition-colors hover:border-white/30"
      >
        No, crear uno nuevo
      </button>

      {hiddenForm}
    </div>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-planneo-300'

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string[]
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/75">{label}</label>
      {children}
      {error?.[0] ? (
        <p className="text-xs text-red-400">{error[0]}</p>
      ) : hint ? (
        <p className="text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  )
}
