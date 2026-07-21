'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { slugify, generateProviderSlug } from '@/lib/slug'
import { sendRegistrationNotification } from '@/lib/email'
import type { SupabaseClient } from '@supabase/supabase-js'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
  /** true cuando ya se envió el código y falta confirmarlo */
  codeSent?: boolean
}

const RegisterSchema = z.object({
  business_name: z.string().min(2, 'El nombre del negocio es obligatorio'),
  category_id: z.string().uuid('Selecciona una categoría válida'),
  contact_name: z.string().min(2, 'El nombre de contacto es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  whatsapp: z.string().optional(),
  zona: z.string().optional(),
  description: z.string().optional(),
})

const CodeSchema = z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos')

export async function registerProvider(
  _prev: State,
  formData: FormData
): Promise<State> {
  const raw = {
    business_name: formData.get('business_name'),
    category_id: formData.get('category_id'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    whatsapp: formData.get('whatsapp'),
    zona: formData.get('zona'),
    description: formData.get('description'),
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const isResend = formData.get('resend') === '1'
  const intent = isResend ? 'resend' : formData.get('intent')

  // Reenvío del código de confirmación de Supabase Auth.
  if (intent === 'resend') {
    const { error } = await supabase.auth.resend({ type: 'signup', email: parsed.data.email })
    if (error) return { codeSent: true, error: 'No se pudo reenviar el código. Espera un momento e intenta de nuevo.' }
    return { codeSent: true }
  }

  // Paso 1: signUp crea el usuario sin confirmar y Supabase envía el código.
  // El perfil del proveedor se crea hasta que el correo quede verificado.
  if (intent === 'request') {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { contact_name: parsed.data.contact_name } },
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

  // Paso 2: verificar el código; luego asignar rol y crear el perfil pendiente.
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

  const userId = verified.user.id
  const service = createServiceClient()

  const { error: roleError } = await service.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'provider_pending' },
  })
  if (roleError) return { error: 'Error al configurar la cuenta. Contáctanos en hola@planneo.mx.' }

  const slug = await resolveUniqueSlug(
    service,
    parsed.data.business_name,
    parsed.data.zona
  )

  const { error: providerError } = await service.from('providers').insert({
    name: parsed.data.business_name,
    slug,
    category_id: parsed.data.category_id,
    status: 'pending',
    claimed_by: userId,
    whatsapp: parsed.data.whatsapp || null,
    zona: parsed.data.zona || null,
    description: parsed.data.description || null,
  })

  if (providerError) {
    return { error: 'Tu cuenta se creó pero no pudimos crear el perfil. Contáctanos en hola@planneo.mx.' }
  }

  // Refrescar la sesión para que el JWT incluya el rol recién asignado
  // (puede completar su perfil en /panel mientras espera aprobación).
  await supabase.auth.refreshSession()

  sendRegistrationNotification(parsed.data.business_name, parsed.data.email).catch(() => {})

  redirect('/registrarme/gracias')
}

async function resolveUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  name: string,
  zona?: string
): Promise<string> {
  const base = zona ? generateProviderSlug(name, zona) : slugify(name)
  let candidate = base
  for (let i = 1; ; i++) {
    const { data } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i}`
  }
}
