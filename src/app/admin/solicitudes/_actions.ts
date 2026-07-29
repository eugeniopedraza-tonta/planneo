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
    .select('name, slug, claimed_by, categories(slug)')
    .eq('id', providerId)
    .maybeSingle()

  if (!provider) return { error: 'Proveedor no encontrado' }

  // El rol ya no cambia al aprobar: todo dueño de un perfil es 'provider' y el
  // estado vive en providers.status. Cambiar el rol de otro usuario no refresca
  // su JWT, así que veía "en revisión" hasta una hora después de ser aprobado.
  const { error: statusError } = await service
    .from('providers')
    .update({ status: 'published', published_at: new Date().toISOString(), paused_at: null })
    .eq('id', providerId)

  if (statusError) return { error: statusError.message }

  const { data: userData } = await service.auth.admin.getUserById(userId)
  if (userData.user?.email) {
    sendApprovalEmail(userData.user.email, provider.name).catch(() => {})
  }

  revalidatePath('/admin/solicitudes')
  revalidatePublicProfile(
    (provider.categories as unknown as { slug: string } | null)?.slug,
    provider.slug
  )
  return {}
}

/**
 * El catálogo y el perfil público se sirven con ISR: sin invalidar, un perfil
 * recién aprobado tarda hasta una hora en aparecer.
 */
function revalidatePublicProfile(categorySlug?: string, slug?: string | null) {
  if (categorySlug && slug) revalidatePath(`/${categorySlug}/${slug}`)
  revalidatePath('/proveedores')
  revalidatePath('/sitemap.xml')
}

export async function rejectProvider(providerId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return { error: 'No autorizado' }

  const service = createServiceClient()

  const { data: provider } = await service
    .from('providers')
    .select('name, slug, categories(slug)')
    .eq('id', providerId)
    .maybeSingle()

  // 'rejected' en vez de degradar el rol: el proveedor debe poder entrar al
  // panel justamente para corregir lo que se le señaló.
  const { error: statusError } = await service
    .from('providers')
    .update({ status: 'rejected' })
    .eq('id', providerId)

  if (statusError) return { error: statusError.message }

  const { data: userData } = await service.auth.admin.getUserById(userId)
  if (userData.user?.email && provider?.name) {
    sendRejectionEmail(userData.user.email, provider.name).catch(() => {})
  }

  revalidatePath('/admin/solicitudes')
  revalidatePublicProfile(
    (provider?.categories as unknown as { slug: string } | null)?.slug,
    provider?.slug
  )
  return {}
}
