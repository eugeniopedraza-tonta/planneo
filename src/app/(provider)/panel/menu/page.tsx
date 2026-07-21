import { createClient } from '@/lib/supabase/server'
import { CATERING_CATEGORY_SLUG } from '@/lib/constants'
import type { CateringMenuWithItems } from '@/lib/types'
import MenusManager from './_menus-manager'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id, categories(slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<{ id: string; categories: { slug: string } | null }>()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  if (provider.categories?.slug !== CATERING_CATEGORY_SLUG) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">
          Esta sección es solo para proveedores de la categoría Banquete / Catering.
        </p>
      </div>
    )
  }

  const { data: menus } = await supabase
    .from('catering_menus')
    .select('*, catering_menu_items(*)')
    .eq('provider_id', provider.id)
    .order('created_at')
    .returns<CateringMenuWithItems[]>()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mis menús</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Arma tus menús por tiempos. Aparecen en tu perfil público para que el cliente
          sepa qué esperar.
        </p>
      </div>
      <MenusManager menus={menus ?? []} />
    </div>
  )
}
