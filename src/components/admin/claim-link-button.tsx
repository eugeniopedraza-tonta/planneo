'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ClaimLinkButton({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/claim/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: providerId }),
      })
      const { url, error } = await res.json()
      if (error || !url) {
        alert('Error generando el link')
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleGenerate}
      disabled={loading}
      className="text-planneo-300 hover:text-planneo-300"
    >
      {loading ? '…' : copied ? '✓ Copiado' : 'Claim link'}
    </Button>
  )
}
