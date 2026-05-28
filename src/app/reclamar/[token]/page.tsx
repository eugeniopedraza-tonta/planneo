import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import { redeemToken } from './_actions'
import ClaimForm from './_claim-form'

type Props = {
  params: Promise<{ token: string }>
}

export default async function ReclamarPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('claim_tokens')
    .select('id, provider_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-2xl mb-2">🔗</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-sm text-gray-500">
            Este enlace no existe o ya no es válido. Contacta a Planneo para obtener uno nuevo.
          </p>
        </div>
      </div>
    )
  }

  if (tokenRow.used_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-2xl mb-2">✅</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Perfil ya reclamado</h1>
          <p className="text-sm text-gray-500">Este perfil ya fue reclamado. Inicia sesión para acceder.</p>
        </div>
      </div>
    )
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-2xl mb-2">⏰</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link expirado</h1>
          <p className="text-sm text-gray-500">
            Este link ya expiró. Pídele a Planneo uno nuevo.
          </p>
        </div>
      </div>
    )
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, description, zona, photos, categories(name)')
    .eq('id', tokenRow.provider_id)
    .maybeSingle()

  const boundAction = redeemToken.bind(null, token)

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#7C3AED]">Planneo</span>
          <h1 className="text-xl font-semibold text-gray-900 mt-3">
            Tu perfil en Planneo está listo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea tu cuenta para activarlo y empezar a recibir clientes.
          </p>
        </div>

        {provider && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="relative w-full h-40 bg-[#7C3AED]/10">
              {provider.photos?.[0] ? (
                <Image
                  src={provider.photos[0]}
                  alt={provider.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl">📸</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <h2 className="text-lg font-semibold text-gray-900">{provider.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(provider.categories as unknown as { name: string } | null)?.name && (
                  <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full font-medium">
                    {(provider.categories as unknown as { name: string }).name}
                  </span>
                )}
                {provider.zona && (
                  <span className="text-xs text-gray-500">{provider.zona}</span>
                )}
              </div>
              {provider.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                  {provider.description}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Crea tu cuenta</h3>
          <ClaimForm action={boundAction} />
          <p className="text-xs text-gray-400 mt-4 text-center">
            Al activar tu perfil aceptas los términos de uso de Planneo.
          </p>
        </div>
      </div>
    </div>
  )
}
