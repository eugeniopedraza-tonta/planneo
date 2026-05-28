'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toggleProviderStatus, deleteProvider } from '../_actions'
import ClaimLinkButton from '@/components/admin/claim-link-button'
import type { ProviderWithCategory } from '@/lib/types'

export default function ProvidersTableActions({ provider }: { provider: ProviderWithCategory }) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleProviderStatus(provider.id, provider.status)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${provider.name}? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    await deleteProvider(provider.id)
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="xs" asChild>
        <Link href={`/admin/proveedores/${provider.id}/editar`}>Editar</Link>
      </Button>

      <Button
        variant="ghost"
        size="xs"
        onClick={handleToggle}
        disabled={loading}
        className={provider.status === 'published' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
      >
        {provider.status === 'published' ? 'Despublicar' : 'Publicar'}
      </Button>

      <ClaimLinkButton providerId={provider.id} />

      <Button variant="ghost" size="xs" onClick={handleDelete} disabled={loading} className="text-red-500 hover:text-red-600">
        Eliminar
      </Button>
    </div>
  )
}
