'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
  /** true cuando ya se envió (o pudo haberse enviado) el código */
  codeSent?: boolean
}

const EmailSchema = z.object({
  email: z.string().email('Email inválido').max(200),
})

const ResetSchema = z.object({
  email: z.string().email('Email inválido').max(200),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

function homeForRole(role: unknown): string {
  if (role === 'admin') return '/admin'
  if (role === 'provider' || role === 'provider_pending') return '/panel'
  return '/mis-consultas'
}

export async function recoverPassword(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const isResend = formData.get('resend') === '1'
  const intent = isResend ? 'resend' : formData.get('intent')

  // Paso 1 (o reenvío): Supabase envía el código de recuperación
  // ({{ .Token }} en la plantilla "Reset password") solo si la cuenta existe,
  // sin revelar en la respuesta si el email está registrado.
  if (intent === 'request' || intent === 'resend') {
    const parsed = EmailSchema.safeParse({ email: formData.get('email') })
    if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

    await supabase.auth.resetPasswordForEmail(parsed.data.email)
    return { codeSent: true }
  }

  // Paso 2: verificar el código (crea sesión) y cambiar la contraseña.
  const parsed = ResetSchema.safeParse({
    email: formData.get('email'),
    code: formData.get('code'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { codeSent: true, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: 'recovery',
  })
  if (verifyError || !verified.user) {
    return { codeSent: true, error: 'Código incorrecto o expirado. Revisa tu correo o pide uno nuevo.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })
  if (updateError) {
    return { codeSent: true, error: 'No se pudo restablecer la contraseña. Intenta de nuevo.' }
  }

  redirect(homeForRole(verified.user.app_metadata?.role))
}
