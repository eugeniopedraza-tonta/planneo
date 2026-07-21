'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendQuoteReplyEmail, sendBookingConfirmedEmail } from '@/lib/email'

const StatusSchema = z.enum(['new', 'read', 'replied', 'closed'])

const ConfirmSchema = z.object({
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  event_location: z.string().max(300).optional(),
})

const ReplySchema = z.object({
  body: z.string().min(1, 'Escribe una respuesta').max(2000),
  quote_amount: z.coerce.number().positive().max(100000000).optional().or(z.literal('')),
})

export type ReplyState = { error?: string; success?: boolean }

/** Respuesta del proveedor (con monto de cotización opcional), dentro de Planneo. */
export async function replyToInquiry(
  inquiryId: string,
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = ReplySchema.safeParse({
    body: formData.get('body'),
    quote_amount: formData.get('quote_amount'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('id, email, access_token')
    .eq('id', inquiryId)
    .eq('provider_id', provider.id)
    .maybeSingle()
  if (!inquiry) return { error: 'Consulta no encontrada' }

  const { error } = await supabase.from('inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender: 'provider',
    body: parsed.data.body.trim(),
    quote_amount: parsed.data.quote_amount || null,
  })
  if (error) return { error: 'No se pudo enviar la respuesta.' }

  await supabase
    .from('inquiries')
    .update({ status: 'replied' })
    .eq('id', inquiry.id)
    .eq('provider_id', provider.id)

  if (inquiry.email) {
    sendQuoteReplyEmail(inquiry.email, provider.name, inquiry.access_token).catch(() => {})
  }

  revalidatePath('/panel/consultas')
  revalidatePath('/panel')
  return { success: true }
}

export type ConfirmState = { error?: string; success?: boolean }

/**
 * Confirma la reservación de una consulta: fija fecha/lugar del evento,
 * marca la consulta como 'confirmed' y bloquea la fecha en el calendario
 * de disponibilidad como 'booked'. El evento aparece en /panel/agenda.
 */
export async function confirmBooking(
  inquiryId: string,
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = ConfirmSchema.safeParse({
    event_date: formData.get('event_date'),
    event_location: formData.get('event_location') ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('id, name, email, access_token')
    .eq('id', inquiryId)
    .eq('provider_id', provider.id)
    .maybeSingle()
  if (!inquiry) return { error: 'Consulta no encontrada' }

  const { error: updateError } = await supabase
    .from('inquiries')
    .update({
      status: 'confirmed',
      event_date: parsed.data.event_date,
      event_location: parsed.data.event_location?.trim() || null,
    })
    .eq('id', inquiry.id)
    .eq('provider_id', provider.id)
  if (updateError) return { error: 'No se pudo confirmar la reservación.' }

  // Bloquear la fecha en el calendario de disponibilidad.
  const { error: availError } = await supabase
    .from('provider_availability')
    .upsert(
      {
        provider_id: provider.id,
        date: parsed.data.event_date,
        status: 'booked',
        note: `Evento confirmado: ${inquiry.name}`,
      },
      { onConflict: 'provider_id,date' }
    )
  if (availError) return { error: 'Se confirmó la consulta pero no se pudo bloquear la fecha en tu calendario.' }

  if (inquiry.email) {
    sendBookingConfirmedEmail(
      inquiry.email,
      provider.name,
      inquiry.access_token,
      parsed.data.event_date,
      parsed.data.event_location?.trim() || null
    ).catch(() => {})
  }

  revalidatePath('/panel/consultas')
  revalidatePath('/panel/agenda')
  revalidatePath('/panel/disponibilidad')
  revalidatePath('/panel')
  return { success: true }
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  if (!provider) return { error: 'Sin perfil vinculado' }

  const parsed = StatusSchema.safeParse(status)
  if (!parsed.success) return { error: 'Estado inválido' }

  const { data, error } = await supabase
    .from('inquiries')
    .update({ status: parsed.data })
    .eq('id', inquiryId)
    .eq('provider_id', provider.id)
    .select('id')
  if (error || !data?.length) return { error: 'No se pudo actualizar la consulta.' }

  revalidatePath('/panel/consultas')
  revalidatePath('/panel')
  return {}
}
