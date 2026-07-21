'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

export async function approveProvider(providerId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return { error: 'No autorizado' }

  const service = createServiceClient()

  const { data: provider } = await service
    .from('providers')
    .select('name, claimed_by')
    .eq('id', providerId)
    .maybeSingle()

  if (!provider) return { error: 'Proveedor no encontrado' }

  const [{ error: roleError }, { error: statusError }] = await Promise.all([
    service.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'provider' },
    }),
    service
      .from('providers')
      .update({ status: 'published' })
      .eq('id', providerId),
  ])

  if (roleError || statusError) return { error: roleError?.message ?? statusError?.message }

  const { data: userData } = await service.auth.admin.getUserById(userId)
  if (userData.user?.email) {
    sendApprovalEmail(userData.user.email, provider.name).catch(() => {})
  }

  revalidatePath('/admin/solicitudes')
  return {}
}

export async function rejectProvider(providerId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return { error: 'No autorizado' }

  const service = createServiceClient()

  const { data: provider } = await service
    .from('providers')
    .select('name')
    .eq('id', providerId)
    .maybeSingle()

  const [{ error: statusError }] = await Promise.all([
    service.from('providers').update({ status: 'draft' }).eq('id', providerId),
    service.auth.admin.updateUserById(userId, { app_metadata: { role: 'provider_rejected' } }),
  ])

  if (statusError) return { error: statusError.message }

  const { data: userData } = await service.auth.admin.getUserById(userId)
  if (userData.user?.email && provider?.name) {
    sendRejectionEmail(userData.user.email, provider.name).catch(() => {})
  }

  revalidatePath('/admin/solicitudes')
  return {}
}
