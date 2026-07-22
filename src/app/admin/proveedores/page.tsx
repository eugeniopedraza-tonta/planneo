import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS } from '@/lib/constants'
import type { ProviderWithCategory } from '@/lib/types'
import ProvidersTableActions from './_components/providers-table-actions'
import CsvImport from '@/components/admin/csv-import'

const PAGE_SIZE = 20

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; category?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.status) query = query.eq('status', params.status)
  if (params.category) query = query.eq('categories.slug', params.category)

  const { data: providers, count } = await query
  const { data: categories } = await supabase.from('categories').select('id, name, slug').order('name')

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Proveedores</h1>
          <p className="text-sm text-white/55 mt-0.5">{count ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImport />
          <Button asChild>
            <Link href="/admin/proveedores/nuevo">+ Nuevo proveedor</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-2 mb-4">
        <select
          name="status"
          defaultValue={params.status ?? ''}
          className="h-9 rounded-lg border border-white/10 bg-planneo-900 px-3 text-sm text-white/75"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="claimed">Reclamado</option>
        </select>

        <select
          name="category"
          defaultValue={params.category ?? ''}
          className="h-9 rounded-lg border border-white/10 bg-planneo-900 px-3 text-sm text-white/75"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        <Button type="reset" variant="ghost" size="sm" asChild>
          <Link href="/admin/proveedores">Limpiar</Link>
        </Button>
      </form>

      {/* Table */}
      <div className="bg-planneo-900 rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">Categoría</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">Zona</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!providers?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/50">
                  Sin proveedores. Crea uno o importa un CSV.
                </td>
              </tr>
            )}
            {(providers as ProviderWithCategory[])?.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.07] transition-colors">
                <td className="px-4 py-3 font-medium text-white">
                  {p.name}
                  <span className="block text-xs text-white/50 font-normal">{p.slug}</span>
                </td>
                <td className="px-4 py-3 text-white/60">{p.categories?.name ?? '—'}</td>
                <td className="px-4 py-3 text-white/60">{p.zona ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-white/55">
                  {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <ProvidersTableActions provider={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-white/55">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/proveedores?page=${page - 1}${params.status ? `&status=${params.status}` : ''}${params.category ? `&category=${params.category}` : ''}`}>
                  ← Anterior
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/proveedores?page=${page + 1}${params.status ? `&status=${params.status}` : ''}${params.category ? `&category=${params.category}` : ''}`}>
                  Siguiente →
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-white/10 text-white/60',
    published: 'bg-planneo-mint/15 text-planneo-mint',
    claimed: 'bg-planneo-600/20 text-planneo-300',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-white/10 text-white/60'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
