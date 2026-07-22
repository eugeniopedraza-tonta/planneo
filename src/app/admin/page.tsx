import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProviders },
    { count: published },
    { count: claimed },
    { count: leads },
  ] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'claimed'),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Total proveedores', value: totalProviders ?? 0, color: 'text-white' },
    { label: 'Publicados', value: published ?? 0, color: 'text-planneo-mint' },
    { label: 'Reclamados', value: claimed ?? 0, color: 'text-planneo-300' },
    { label: 'Leads totales', value: leads ?? 0, color: 'text-sky-300' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-planneo-900 rounded-xl border border-white/10 p-5">
            <p className="text-sm text-white/55 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-planneo-900 rounded-xl border border-white/10 p-6">
        <h2 className="text-base font-semibold text-white/75 mb-2">Próximos pasos</h2>
        <ul className="text-sm text-white/55 flex flex-col gap-1">
          <li>→ Agrega proveedores desde <Link href="/admin/proveedores" className="text-planneo-300 hover:underline">Proveedores</Link></li>
          <li>→ Importa el CSV de Gus para cargar en bloque</li>
          <li>→ Genera links de reclamación para las sales calls</li>
        </ul>
      </div>
    </div>
  )
}
