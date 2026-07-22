import { createClient } from '@/lib/supabase/server'
import { CATERING_CATEGORY_SLUG } from '@/lib/constants'
import type { CateringMenuWithItems } from '@/lib/types'
import { getOwnedProviderWithCategory } from '../../_lib/owned-provider'
import MenusManager from './_menus-manager'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const supabase = await createClient()
  const provider = await getOwnedProviderWithCategory(supabase)

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  if (provider.categories?.slug !== CATERING_CATEGORY_SLUG) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">
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
        <h1 className="text-xl font-semibold text-white">Mis menús</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Arma tus menús por tiempos. Aparecen en tu perfil público para que el cliente
          sepa qué esperar.
        </p>
      </div>
      <MenusManager menus={menus ?? []} />
    </div>
  )
}
