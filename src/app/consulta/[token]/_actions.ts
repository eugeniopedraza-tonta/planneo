'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const TokenSchema = z.string().uuid()
const BodySchema = z.string().min(1, 'Escribe un mensaje').max(2000)

/**
 * Réplica del cliente en su consulta. El token (capability URL) es la
 * autorización: solo quien tiene el enlace puede escribir en este hilo.
 */
export async function replyAsClient(token: string, _prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const parsedToken = TokenSchema.safeParse(token)
  const parsedBody = BodySchema.safeParse(formData.get('body'))
  if (!parsedToken.success) return { error: 'Enlace inválido.' }
  if (!parsedBody.success) return { error: parsedBody.error.issues[0].message }

  const service = createServiceClient()
  const { data: inquiry } = await service
    .from('inquiries')
    .select('id, status')
    .eq('access_token', parsedToken.data)
    .maybeSingle()
  if (!inquiry) return { error: 'Enlace inválido.' }

  const { error } = await service.from('inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender: 'client',
    body: parsedBody.data.trim(),
  })
  if (error) return { error: 'No se pudo enviar tu mensaje. Intenta de nuevo.' }

  // El proveedor ve la consulta como nueva actividad en su buzón.
  if (inquiry.status === 'replied' || inquiry.status === 'read') {
    await service.from('inquiries').update({ status: 'new' }).eq('id', inquiry.id)
  }

  revalidatePath(`/consulta/${parsedToken.data}`)
  return {}
}
