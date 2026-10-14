'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Dispara un evento de vista al montar (home_view, category_view, search_view).
 * Sin UI; se coloca junto al contenido de la página.
 */
export default function PageEvent({
  name,
  params,
}: {
  name: string
  params?: Record<string, string | number | null | undefined>
}) {
  const key = JSON.stringify(params ?? {})

  useEffect(() => {
    trackEvent(name, JSON.parse(key) as Record<string, unknown>)
  }, [name, key])

  return null
}
