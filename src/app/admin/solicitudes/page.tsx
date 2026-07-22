import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { approveProvider, rejectProvider } from './_actions'

export const dynamic = 'force-dynamic'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/login')

  const service = createServiceClient()
  const { data: pending } = await service
    .from('providers')
    .select('id, name, slug, whatsapp, zona, description, claimed_by, created_at, categories(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  type PendingRow = NonNullable<typeof pending>[number]

  async function getEmail(userId: string | null) {
    if (!userId) return null
    const { data } = await service.auth.admin.getUserById(userId)
    return data.user?.email ?? null
  }

  const rows = await Promise.all(
    (pending ?? []).map(async (p: PendingRow) => ({
      ...p,
      email: await getEmail(p.claimed_by),
    }))
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Solicitudes de registro</h1>
          <p className="text-sm text-white/55 mt-0.5">{rows.length} proveedor{rows.length === 1 ? '' : 'es'} pendiente{rows.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-planneo-900 p-12 text-center">
          <p className="text-sm text-white/50">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <div key={p.id} className="bg-planneo-900 rounded-2xl border border-white/10 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-white">{p.name}</h2>
                    <span className="text-xs bg-amber-300/10 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full font-medium">
                      Pendiente
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/55">
                    {/* @ts-expect-error categories is a join */}
                    {p.categories?.name && <span>{p.categories.name}</span>}
                    {p.zona && <span>{p.zona}</span>}
                    {p.email && <span>{p.email}</span>}
                    {p.whatsapp && <span>{p.whatsapp}</span>}
                  </div>
                  {p.description && (
                    <p className="mt-2 text-sm text-white/60 line-clamp-2">{p.description}</p>
                  )}
                  <p className="mt-1 text-xs text-white/50">
                    Enviado el {new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <form action={async () => {
                    'use server'
                    await approveProvider(p.id, p.claimed_by ?? '')
                  }}>
                    <button
                      type="submit"
                      className="rounded-xl bg-planneo-600 px-4 py-2 text-sm font-medium text-white hover:bg-planneo-500 transition-colors"
                    >
                      Aprobar
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await rejectProvider(p.id, p.claimed_by ?? '')
                  }}>
                    <button
                      type="submit"
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.07] transition-colors"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
