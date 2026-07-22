import { createClient } from '@/lib/supabase/server'
import { MAX_PHOTOS_PER_PROVIDER } from '@/lib/media'
import type { ProviderMedia } from '@/lib/types'
import PhotoManager from './_photo-manager'

export const dynamic = 'force-dynamic'

export default async function FotosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  const { data: photos } = await supabase
    .from('provider_media')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('type', 'photo')
    .order('sort_order')
    .returns<ProviderMedia[]>()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Fotos</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Muestra tu trabajo. La primera foto es la portada de tu perfil público.
          Máximo {MAX_PHOTOS_PER_PROVIDER} fotos.
        </p>
      </div>
      <PhotoManager initialPhotos={photos ?? []} />
    </div>
  )
}
