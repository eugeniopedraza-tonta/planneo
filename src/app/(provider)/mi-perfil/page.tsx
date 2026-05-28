import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { ProviderWithCategory } from '@/lib/types'
import EditProfileForm from './_edit-form'

export default async function MiPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-sm text-gray-500">No tienes sesión activa.</p>
      </div>
    )
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<ProviderWithCategory>()

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-2xl mb-2">🔍</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Sin perfil vinculado</h1>
          <p className="text-sm text-gray-500">
            Tu cuenta no tiene un perfil vinculado. Contacta a Planneo para más información.
          </p>
        </div>
      </div>
    )
  }

  // Server-rendered dashboard metric. This intentionally changes over time.
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { count: leadsCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', provider.id)
    .in('type', ['whatsapp_click', 'profile_view'])
    .gte('created_at', sevenDaysAgo)

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#7C3AED]">Planneo</span>
          <span className="text-sm text-gray-500">Mi perfil</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative w-full h-44 bg-[#7C3AED]/10">
            {provider.photos?.[0] ? (
              <Image
                src={provider.photos[0]}
                alt={provider.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl">📸</span>
              </div>
            )}
          </div>
          <div className="p-5">
            <h1 className="text-xl font-semibold text-gray-900">{provider.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {provider.categories?.name && (
                <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full font-medium">
                  {provider.categories.name}
                </span>
              )}
              {provider.zona && (
                <span className="text-xs text-gray-500">{provider.zona}</span>
              )}
              {provider.price_range && (
                <span className="text-xs text-gray-500 font-medium">{provider.price_range}</span>
              )}
            </div>
            {provider.description && (
              <p className="text-sm text-gray-600 mt-3">{provider.description}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Estadísticas — últimos 7 días
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center bg-[#7C3AED]/10 rounded-xl px-6 py-4 min-w-[100px]">
              <span className="text-3xl font-bold text-[#7C3AED]">{leadsCount ?? 0}</span>
              <span className="text-xs text-gray-500 mt-1 text-center">Visitas e interacciones</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Editar perfil</h2>
          <EditProfileForm provider={provider} />
        </div>
      </div>
    </div>
  )
}
