'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
  /** true cuando ya se envió el código y falta confirmarlo */
  codeSent?: boolean
}

const RegisterClientSchema = z.object({
  name: z.string().min(2, 'Tu nombre es obligatorio').max(120),
  email: z.string().email('Email inválido').max(200),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  next: z.string().startsWith('/').max(500).optional().or(z.literal('')),
})

const CodeSchema = z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos')

export async function registerClient(_prev: State, formData: FormData): Promise<State> {
  const parsed = RegisterClientSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const isResend = formData.get('resend') === '1'
  const intent = isResend ? 'resend' : formData.get('intent')

  // Reenvío del código de confirmación de Supabase Auth.
  if (intent === 'resend') {
    const { error } = await supabase.auth.resend({ type: 'signup', email: parsed.data.email })
    if (error) return { codeSent: true, error: 'No se pudo reenviar el código. Espera un momento e intenta de nuevo.' }
    return { codeSent: true }
  }

  // Paso 1: signUp crea el usuario sin confirmar y Supabase envía el código
  // ({{ .Token }} en la plantilla "Confirm signup").
  if (intent === 'request') {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name } },
    })
    // Email ya registrado: según la versión/configuración, Supabase devuelve
    // un error explícito o un usuario ofuscado sin identidades.
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return { error: 'Ya existe una cuenta con ese email. Inicia sesión.' }
      }
      return { error: 'No se pudo iniciar el registro. Intenta de nuevo.' }
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { error: 'Ya existe una cuenta con ese email. Inicia sesión.' }
    }
    return { codeSent: true }
  }

  // Paso 2: verificar el código. verifyOtp confirma el email e inicia sesión.
  const code = CodeSchema.safeParse(formData.get('code'))
  if (!code.success) return { codeSent: true, error: code.error.issues[0].message }

  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: code.data,
    type: 'email',
  })
  if (verifyError || !verified.user) {
    return { codeSent: true, error: 'Código incorrecto o expirado. Revisa tu correo o pide uno nuevo.' }
  }

  // El rol vive en app_metadata y solo se asigna con service role.
  const service = createServiceClient()
  const { error: roleError } = await service.auth.admin.updateUserById(verified.user.id, {
    app_metadata: { role: 'client' },
  })
  if (roleError) return { error: 'Error al configurar la cuenta. Intenta iniciar sesión.' }

  // Refrescar la sesión para que el JWT incluya el rol recién asignado.
  await supabase.auth.refreshSession()

  redirect(parsed.data.next || '/mis-consultas')
}
