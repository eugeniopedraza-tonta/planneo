import { createClient } from '@/lib/supabase/server'
import type { ProviderWithCategory } from '@/lib/types'
import ProfileForm from './_profile-form'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<ProviderWithCategory>()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Mi perfil</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Esta información aparece en tu perfil público
          {provider.categories?.name ? ` de ${provider.categories.name}` : ''}.
        </p>
      </div>
      <div className="bg-planneo-900 rounded-2xl border border-white/10 p-6">
        <ProfileForm provider={provider} />
      </div>
    </div>
  )
}
