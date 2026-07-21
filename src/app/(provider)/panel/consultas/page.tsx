import { createClient } from '@/lib/supabase/server'
import type { InquiryWithMessages } from '@/lib/types'
import InquiryList from './_inquiry-list'

export const dynamic = 'force-dynamic'

export default async function ConsultasPage() {
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
        <p className="text-sm text-gray-500">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, inquiry_messages(*)')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'inquiry_messages', ascending: true })
    .returns<InquiryWithMessages[]>()

  const newCount = inquiries?.filter((i) => i.status === 'new').length ?? 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Consultas
          {newCount > 0 && (
            <span className="ml-2 text-xs font-medium bg-[#7C3AED] text-white px-2 py-0.5 rounded-full align-middle">
              {newCount} nueva{newCount > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Personas interesadas en tus servicios. Cotiza y responde directamente desde Planneo.
        </p>
      </div>
      <InquiryList inquiries={inquiries ?? []} />
    </div>
  )
}
