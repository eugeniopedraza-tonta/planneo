'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient, createStaticClient } from '@/lib/supabase/server'
import { sendInquiryReceivedEmail } from '@/lib/email'

export type State = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

const InquirySchema = z.object({
  provider_id: z.string().uuid(),
  name: z.string().min(2, 'Tu nombre es obligatorio').max(120),
  email: z.string().email('Email inválido').max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  event_type: z.enum(['bodas', 'xv', 'corporativo', 'graduacion']).optional().or(z.literal('')),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  event_location: z.string().max(300).optional(),
  guest_count: z.coerce.number().int().positive().max(100000).optional().or(z.literal('')),
  message: z.string().min(10, 'Cuéntanos un poco más sobre tu evento (mínimo 10 caracteres)').max(2000),
})

export async function createInquiry(_prev: State, formData: FormData): Promise<State> {
  // Honeypot anti-spam: campo invisible que los humanos dejan vacío.
  if (formData.get('website')) redirect('/')

  const parsed = InquirySchema.safeParse({
    provider_id: formData.get('provider_id'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    event_type: formData.get('event_type'),
    event_date: formData.get('event_date'),
    event_location: formData.get('event_location'),
    guest_count: formData.get('guest_count'),
    message: formData.get('message'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  if (!parsed.data.email && !parsed.data.phone?.trim()) {
    return { error: 'Deja tu email o teléfono para que el proveedor pueda responderte.' }
  }

  // El proveedor debe existir y estar publicado (validado con el cliente anónimo).
  const anon = createStaticClient()
  const { data: provider } = await anon
    .from('providers')
    .select('id, name')
    .eq('id', parsed.data.provider_id)
    .in('status', ['published', 'claimed'])
    .maybeSingle()
  if (!provider) return { error: 'Este proveedor no está disponible.' }

  // Si el cliente tiene sesión iniciada, la consulta queda ligada a su cuenta
  // y aparecerá en /mis-consultas. Sin sesión, el token sigue siendo su acceso.
  const authed = await createClient()
  const { data: { user } } = await authed.auth.getUser()

  // Insert con service role para recuperar el access_token (anon no puede leer inquiries).
  const service = createServiceClient()
  const { data: inquiry, error } = await service
    .from('inquiries')
    .insert({
      provider_id: provider.id,
      client_user_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone?.trim() || null,
      event_type: parsed.data.event_type || null,
      event_date: parsed.data.event_date || null,
      event_location: parsed.data.event_location?.trim() || null,
      guest_count: parsed.data.guest_count || null,
      message: parsed.data.message,
    })
    .select('access_token')
    .single()

  if (error || !inquiry) {
    return { error: 'No se pudo enviar tu solicitud. Intenta de nuevo.' }
  }

  if (parsed.data.email) {
    sendInquiryReceivedEmail(parsed.data.email, provider.name, inquiry.access_token).catch(() => {})
  }

  redirect(`/consulta/${inquiry.access_token}?enviada=1`)
}
