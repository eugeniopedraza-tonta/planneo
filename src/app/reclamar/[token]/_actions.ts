'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

const RedeemSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function redeemToken(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = RedeemSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = createServiceClient()

  const { data: tokenRow, error: tokenError } = await supabase
    .from('claim_tokens')
    .select('id, provider_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()

  if (tokenError || !tokenRow) {
    return { error: 'Link inválido.' }
  }

  if (tokenRow.used_at) {
    return { error: 'Este perfil ya fue reclamado.' }
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return { error: 'Este link ya expiró. Pídele a Planneo uno nuevo.' }
  }

  const { data: authData, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'provider' },
    })

  if (createError) {
    if (createError.message.toLowerCase().includes('already')) {
      return { error: 'Ya existe una cuenta con ese email.' }
    }
    return { error: createError.message }
  }

  const userId = authData.user.id

  const { error: providerError } = await supabase
    .from('providers')
    .update({ status: 'claimed', claimed_by: userId })
    .eq('id', tokenRow.provider_id)

  if (providerError) {
    return { error: 'Error al activar el perfil. Intenta de nuevo.' }
  }

  await supabase
    .from('claim_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  const { data: provider } = await supabase
    .from('providers')
    .select('name')
    .eq('id', tokenRow.provider_id)
    .maybeSingle()

  if (provider?.name) {
    await sendWelcomeEmail(email, provider.name)
  }

  redirect('/mi-perfil')
}
