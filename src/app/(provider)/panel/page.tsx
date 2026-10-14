import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProviderReadiness } from '@/lib/provider-readiness'
import type { ProviderWithCategory } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('claimed_by', user.id)
    .maybeSingle<ProviderWithCategory>()

  // Métrica renderizada en servidor; cambia con el tiempo intencionalmente.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [
    { count: leadsCount },
    { count: newInquiries },
    { count: upcomingEvents },
    { count: packagesCount },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true })
      .eq('provider_id', provider?.id ?? '')
      .gte('created_at', sevenDaysAgo),
    supabase.from('inquiries').select('id', { count: 'exact', head: true })
      .eq('provider_id', provider?.id ?? '')
      .eq('status', 'new'),
    supabase.from('inquiries').select('id', { count: 'exact', head: true })
      .eq('provider_id', provider?.id ?? '')
      .eq('status', 'confirmed')
      .gte('event_date', today),
    supabase.from('service_packages').select('id', { count: 'exact', head: true })
      .eq('provider_id', provider?.id ?? ''),
  ])

  const { data: progress } = await supabase
    .from('provider_onboarding_progress')
    .select('terms_version, privacy_version')
    .eq('provider_id', provider?.id ?? '')
    .maybeSingle()

  const isPending = provider?.status === 'pending_review'
  // El progreso se recalcula aquí para que el banner nunca contradiga al hub.
  const readiness = provider
    ? getProviderReadiness({
        name: provider.name,
        category_id: provider.category_id,
        zona: provider.zona,
        phone: provider.phone,
        description: provider.description,
        event_types: provider.event_types,
        photos: provider.photos,
        termsAcceptedVersion: progress?.terms_version ?? null,
        privacyAcceptedVersion: progress?.privacy_version ?? null,
      })
    : null

  const needsActivation = provider && provider.status !== 'published' && !isPending

  return (
    <div className="p-8 max-w-4xl">
      {isPending && (
        <div className="mb-6 rounded-2xl bg-amber-300/10 border border-amber-300/30 px-5 py-4">
          <p className="text-sm font-medium text-amber-200">Tu perfil está en revisión</p>
          <p className="text-sm text-amber-200 mt-0.5">
            Lo revisaremos en las próximas 24–48 horas. Mientras tanto, puedes completar tu información.
          </p>
        </div>
      )}

      {needsActivation && readiness && (
        <Link
          href="/panel/onboarding"
          className="mb-6 block rounded-2xl border border-planneo-300/30 bg-planneo-600/10 px-5 py-4 transition-colors hover:border-planneo-300/60"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                {provider.status === 'rejected'
                  ? 'Tu perfil necesita cambios'
                  : `Tu perfil está al ${readiness.percent}%`}
              </p>
              <p className="mt-0.5 text-sm text-white/60">
                {readiness.isReady
                  ? 'Ya puedes publicarlo y empezar a recibir cotizaciones.'
                  : `Faltan ${readiness.missing.length} tareas para publicarlo.`}
              </p>
            </div>
            <span className="shrink-0 rounded-xl bg-planneo-600 px-4 py-2 text-xs font-semibold text-white">
              Continuar
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-planneo-mint"
              style={{ width: `${readiness.percent}%` }}
            />
          </div>
        </Link>
      )}

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">
          Hola, <span className="text-planneo-300">{provider?.name ?? 'proveedor'}</span>
        </h1>
        <p className="text-sm text-white/55 mt-0.5">
          {isPending ? 'Completa tu perfil mientras esperamos la aprobación.' : 'Aquí puedes gestionar todo tu perfil.'}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Visitas (7 días)" value={leadsCount ?? 0} />
        <StatCard label="Consultas nuevas" value={newInquiries ?? 0} accent={!!newInquiries} />
        <StatCard label="Eventos próximos" value={upcomingEvents ?? 0} accent={!!upcomingEvents} />
        <StatCard label="Paquetes" value={packagesCount ?? 0} />
      </div>

      {/* Accesos rápidos */}
      <h2 className="text-sm font-semibold text-white/55 uppercase tracking-wide mb-3">Completar perfil</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink href="/panel/perfil" title="Editar información" desc="Nombre, descripción, zona, precio, eventos" />
        <QuickLink href="/panel/fotos" title="Subir fotos" desc="Muestra tu trabajo con imágenes" />
        <QuickLink href="/panel/media" title="Audio / Video" desc="Snippets de tu trabajo (músicos, DJ, etc.)" />
        <QuickLink href="/panel/paquetes" title="Mis paquetes" desc="Define tus servicios y precios" />
        <QuickLink href="/panel/disponibilidad" title="Disponibilidad" desc="Marca tus fechas libres y reservadas" />
        <QuickLink href="/panel/consultas" title="Consultas" desc={newInquiries ? `${newInquiries} nueva${newInquiries > 1 ? 's' : ''}` : 'Sin consultas nuevas'} accent={!!newInquiries} />
        <QuickLink href="/panel/agenda" title="Agenda" desc={upcomingEvents ? `${upcomingEvents} evento${upcomingEvents > 1 ? 's' : ''} próximo${upcomingEvents > 1 ? 's' : ''}` : 'Sin eventos confirmados'} accent={!!upcomingEvents} />
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`bg-planneo-900 rounded-2xl border p-4 ${accent ? 'border-planneo-300/40' : 'border-white/10'}`}>
      <p className={`text-xl font-bold ${accent ? 'text-planneo-300' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-white/55 mt-0.5">{label}</p>
    </div>
  )
}

function QuickLink({ href, title, desc, accent }: { href: string; title: string; desc: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between bg-planneo-900 rounded-2xl border p-4 hover:shadow-sm transition-shadow ${accent ? 'border-planneo-300/40' : 'border-white/10'}`}
    >
      <div>
        <p className={`text-sm font-medium ${accent ? 'text-planneo-300' : 'text-white'}`}>{title}</p>
        <p className="text-xs text-white/55 mt-0.5">{desc}</p>
      </div>
      <svg className="size-4 text-white/50 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
