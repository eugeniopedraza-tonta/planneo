'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * `provider_card_clicked` por delegación: ProviderCard es server component y
 * solo marca su enlace con data-track="provider_card" + data-provider-id +
 * data-category-slug. Un solo listener en captura cubre todos los catálogos.
 */
export default function ProviderCardClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null
      const card = target?.closest<HTMLElement>('[data-track="provider_card"]')
      if (!card) return
      trackEvent('provider_card_clicked', {
        provider_id: card.dataset.providerId,
        category_slug: card.dataset.categorySlug,
        page_path: window.location.pathname,
      })
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
