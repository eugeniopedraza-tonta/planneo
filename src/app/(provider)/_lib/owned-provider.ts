import { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Autentica al usuario y devuelve el proveedor del que es dueño.
 * Devuelve null si no hay sesión o no hay perfil vinculado.
 */
export async function getOwnedProvider(supabase: Supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()
  return provider
}

/** Igual que getOwnedProvider, con el slug de categoría para secciones gateadas. */
export async function getOwnedProviderWithCategory(supabase: Supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: provider } = await supabase
    .from('providers')
    .select('id, categories(slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<{ id: string; categories: { slug: string } | null }>()
  return provider
}
