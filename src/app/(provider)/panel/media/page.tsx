import { createClient } from '@/lib/supabase/server'
import { MAX_MEDIA_PER_PROVIDER } from '@/lib/media'
import type { ProviderMedia } from '@/lib/types'
import MediaManager from './_media-manager'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
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

  const { data: media } = await supabase
    .from('provider_media')
    .select('*')
    .eq('provider_id', provider.id)
    .in('type', ['audio', 'video'])
    .order('sort_order')
    .returns<ProviderMedia[]>()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Audio / Video</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Snippets de tu trabajo: demos musicales, mezclas, clips de eventos.
          Máximo {MAX_MEDIA_PER_PROVIDER} archivos.
        </p>
      </div>
      <MediaManager initialMedia={media ?? []} />
    </div>
  )
}
