'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { State } from './_actions'

type Props = {
  action: (prev: State, formData: FormData) => Promise<State>
}

export default function ClaimForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-red-300">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          required
          aria-invalid={!!state.fieldErrors?.password}
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-red-300">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? 'Activando perfil…' : 'Confirmar y activar mi perfil'}
      </Button>
    </form>
  )
}
