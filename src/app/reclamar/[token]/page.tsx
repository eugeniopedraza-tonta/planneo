import Image from 'next/image'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { trackOnboardingEvent, hoursSince } from '@/lib/onboarding-events'
import { startClaim, claimAsCurrentUser, reportWrongBusiness } from './_actions'
import ClaimFlow from './_claim-flow'
import { LinkIcon, CheckCircleIcon, ClockIcon, CameraIcon } from '@/components/icons'

export const metadata = {
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ token: string }>
}

export default async function ReclamarPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('claim_tokens')
    .select('id, provider_id, expires_at, used_at, revoked_at, created_at')
    .eq('token', token)
    .maybeSingle()

  // Un token inexistente o revocado se trata igual que uno inválido: no se
  // revela nada del perfil ni de quién lo reclamó.
  if (!tokenRow || tokenRow.revoked_at) {
    return (
      <Notice
        icon={<LinkIcon className="size-8" />}
        title="Enlace no válido"
        body="Este enlace ya no es válido. Solicita uno nuevo a Planneo."
      />
    )
  }

  if (tokenRow.used_at) {
    return (
      <Notice
        icon={<CheckCircleIcon className="size-8" />}
        title="Perfil ya reclamado"
        body="Este perfil ya fue reclamado. Inicia sesión si es tu cuenta."
        action={{ href: '/login', label: 'Iniciar sesión' }}
      />
    )
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <Notice
        icon={<ClockIcon className="size-8" />}
        title="Enlace expirado"
        body="Este enlace ya no es válido. Solicita uno nuevo a Planneo."
      />
    )
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, description, zona, photos, categories(name)')
    .eq('id', tokenRow.provider_id)
    .maybeSingle()

  if (!provider) {
    return (
      <Notice
        icon={<LinkIcon className="size-8" />}
        title="Enlace no válido"
        body="Este enlace ya no es válido. Solicita uno nuevo a Planneo."
      />
    )
  }

  // Estado de sesión: quien ya entró no tiene por qué pedir otro código.
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()

  let ownedProviderName: string | null = null
  if (user) {
    const { data: owned } = await supabase
      .from('providers')
      .select('name')
      .eq('claimed_by', user.id)
      .maybeSingle()
    ownedProviderName = owned?.name ?? null
  }

  trackOnboardingEvent('provider_claim_previewed', {
    providerId: provider.id,
    userId: user?.id,
    properties: { token_age_hours: hoursSince(tokenRow.created_at) },
  }).catch(() => {})

  const categoryName = (provider.categories as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-planneo-950 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
            Planneo
          </span>
          <h1 className="mt-3 text-lg font-semibold text-white">Tu perfil ya está preparado</h1>
          <p className="mt-1 text-sm text-white/60">
            Revisa cómo podrán encontrarte en Planneo. Puedes corregir cualquier detalle antes de
            activarlo. Es gratis y toma alrededor de 2 minutos.
          </p>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-planneo-900 shadow-sm">
          <div className="relative h-40 w-full bg-planneo-600/20">
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
              <div className="flex h-full w-full items-center justify-center">
                <CameraIcon className="size-10 text-white/30" />
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              Vista previa — aún no es pública
            </span>
          </div>

          <div className="p-5">
            <h2 className="text-lg font-semibold text-white">{provider.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {categoryName && (
                <span className="rounded-full bg-planneo-600/20 px-2 py-0.5 text-xs font-medium text-planneo-300">
                  {categoryName}
                </span>
              )}
              {provider.zona && <span className="text-xs text-white/55">{provider.zona}</span>}
            </div>
            {provider.description && (
              <p className="mt-3 line-clamp-3 text-sm text-white/60">{provider.description}</p>
            )}

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Después podrás editar
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-white/60">
                <li>Fotos y logo</li>
                <li>Descripción</li>
                <li>Paquetes y precios</li>
                <li>Tipos de evento</li>
                <li>Zonas donde atiendes</li>
                <li>Fechas ocupadas</li>
              </ul>
            </div>
          </div>
        </div>

        <ClaimFlow
          startAction={startClaim.bind(null, token)}
          claimAsCurrentUserAction={claimAsCurrentUser.bind(null, token)}
          reportAction={reportWrongBusiness.bind(null, token)}
          sessionEmail={user?.email ?? null}
          ownedProviderName={ownedProviderName}
          isAdmin={user?.app_metadata?.role === 'admin'}
          businessName={provider.name}
        />
      </div>
    </div>
  )
}

function Notice({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-planneo-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-planneo-900 p-8 text-center shadow-sm">
        <div className="mb-3 flex justify-center text-planneo-300">{icon}</div>
        <h1 className="mb-2 text-lg font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/55">{body}</p>
        {action && (
          <Link
            href={action.href}
            className="mt-5 inline-flex rounded-md bg-planneo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
          >
            {action.label}
          </Link>
        )}
        <p className="mt-4 text-xs text-white/40">
          ¿Necesitas ayuda? Escríbenos a{' '}
          <a href="mailto:hola@planneo.mx" className="underline">hola@planneo.mx</a>
        </p>
      </div>
    </div>
  )
}
