'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function getOrCreateSessionId(): string {
  const key = 'planneo_session'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

export default function ProfileViewTracker({
  providerId,
  providerName,
  category,
}: {
  providerId: string
  providerName: string
  category?: string | null
}) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    const payload = JSON.stringify({
      provider_id: providerId,
      type: 'profile_view',
      session_id: sessionId,
    })

    if (!navigator.sendBeacon?.('/api/leads', new Blob([payload], { type: 'application/json' }))) {
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'profile_view', {
        provider_id: providerId,
        provider_name: providerName,
        category,
      })
    }
  }, [category, providerId, providerName])

  return null
}
