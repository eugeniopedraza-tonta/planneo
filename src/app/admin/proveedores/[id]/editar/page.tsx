import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import ProviderForm from '@/components/admin/provider-form'
import { updateProvider } from '../../_actions'
import type { Provider } from '@/lib/types'

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: provider }, { data: categories }] = await Promise.all([
    supabase.from('providers').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug').order('name'),
  ])

  if (!provider) notFound()

  const boundAction = updateProvider.bind(null, id)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/proveedores">← Volver</Link>
        </Button>
        <h1 className="text-2xl font-bold text-white">Editar proveedor</h1>
      </div>

      <div className="bg-planneo-900 rounded-xl border border-white/10 p-6">
        <ProviderForm
          categories={categories ?? []}
          action={boundAction}
          defaultValues={provider as Provider}
        />
      </div>
    </div>
  )
}
