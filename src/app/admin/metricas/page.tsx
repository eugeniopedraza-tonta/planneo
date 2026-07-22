import { createClient } from '@/lib/supabase/server'

type LeadRow = {
  id: string
  provider_id: string | null
  type: 'whatsapp_click' | 'profile_view'
  referrer: string | null
  created_at: string
  providers: { name: string; categories: { name: string } | null } | null
}

export default async function MetricasPage() {
  const supabase = await createClient()
  // Server-rendered reporting window. This intentionally changes over time.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: totalLeads }, { count: whatsappClicks }, { count: profileViews }, { data: leads }] =
    await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('type', 'whatsapp_click').gte('created_at', since),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('type', 'profile_view').gte('created_at', since),
      supabase
        .from('leads')
        .select('id, provider_id, type, referrer, created_at, providers(name, categories(name))')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(300),
    ])

  const rows = (leads ?? []) as unknown as LeadRow[]
  const byProvider = new Map<string, { name: string; views: number; clicks: number }>()
  const byCategory = new Map<string, number>()

  for (const lead of rows) {
    const key = lead.provider_id ?? 'sin-provider'
    const current = byProvider.get(key) ?? {
      name: lead.providers?.name ?? 'Proveedor eliminado',
      views: 0,
      clicks: 0,
    }

    if (lead.type === 'profile_view') current.views++
    if (lead.type === 'whatsapp_click') current.clicks++
    byProvider.set(key, current)

    const category = lead.providers?.categories?.name ?? 'Sin categoría'
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1)
  }

  const topProviders = [...byProvider.values()]
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views)
    .slice(0, 10)

  const categoryRows = [...byCategory.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Métricas</h1>
        <p className="mt-1 text-sm text-white/55">Leads y actividad de los últimos 30 días.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Leads totales" value={totalLeads ?? 0} />
        <MetricCard label="Vistas de perfil" value={profileViews ?? 0} />
        <MetricCard label="Clicks a WhatsApp" value={whatsappClicks ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-planneo-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">Top proveedores</h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-white/55">
                <tr>
                  <th className="px-3 py-2">Proveedor</th>
                  <th className="px-3 py-2">Vistas</th>
                  <th className="px-3 py-2">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {topProviders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-white/50">
                      Todavía no hay leads.
                    </td>
                  </tr>
                ) : (
                  topProviders.map((provider) => (
                    <tr key={provider.name}>
                      <td className="px-3 py-2 font-medium text-white">{provider.name}</td>
                      <td className="px-3 py-2 text-white/60">{provider.views}</td>
                      <td className="px-3 py-2 text-white/60">{provider.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-planneo-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">Leads por categoría</h2>
          <div className="space-y-3">
            {categoryRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">Sin actividad por categoría.</p>
            ) : (
              categoryRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-white/75">{row.name}</span>
                    <span className="text-white/55">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-planneo-600"
                      style={{ width: `${Math.max(8, (row.count / Math.max(categoryRows[0].count, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-planneo-900 p-5">
      <p className="mb-1 text-sm text-white/55">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
