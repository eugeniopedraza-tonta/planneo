import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import ProviderForm from '@/components/admin/provider-form'
import { createProvider } from '../_actions'

export default async function NuevoProveedorPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id, name, slug').order('name')

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/proveedores">← Volver</Link>
        </Button>
        <h1 className="text-2xl font-bold text-white">Nuevo proveedor</h1>
      </div>

      <div className="bg-planneo-900 rounded-xl border border-white/10 p-6">
        <ProviderForm categories={categories ?? []} action={createProvider} />
      </div>
    </div>
  )
}
