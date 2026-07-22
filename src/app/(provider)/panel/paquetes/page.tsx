import { createClient } from '@/lib/supabase/server'
import type { ServicePackage } from '@/lib/types'
import PackagesManager from './_packages-manager'

export const dynamic = 'force-dynamic'

export default async function PaquetesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  const { data: packages } = await supabase
    .from('service_packages')
    .select('*')
    .eq('provider_id', provider.id)
    .order('sort_order')
    .order('created_at')
    .returns<ServicePackage[]>()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Mis paquetes</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Define tus servicios con precios claros. Los paquetes aparecen en tu perfil público.
        </p>
      </div>
      <PackagesManager packages={packages ?? []} />
    </div>
  )
}
