'use client'

import { getOrCreateSessionId, trackEvent } from '@/lib/analytics'
import { whatsAppUrl } from '@/lib/whatsapp'

type Props = {
  providerId: string
  phone: string
  providerName: string
  categorySlug?: string | null
  className?: string
  children?: React.ReactNode
}

/** Verde WhatsApp con texto oscuro (#0B141A): nunca blanco sobre verde. */
const BASE_CLASS =
  'inline-flex w-full min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md bg-whatsapp px-5 text-base font-semibold text-whatsapp-ink transition-colors hover:bg-whatsapp-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whatsapp'

/**
 * CTA directo a wa.me. Sin muro de login (NEXT_PUBLIC_FEATURE_WHATSAPP_WALL
 * queda OFF en el MVP): funciona sin sesión. Registra el lead con
 * sendBeacon/keepalive para que abrir WhatsApp no cancele la petición.
 */
export default function WhatsAppButton({
  providerId,
  phone,
  providerName,
  categorySlug,
  className,
  children,
}: Props) {
  const href = whatsAppUrl(phone)
  if (!href) return null

  function handleClick() {
    const sessionId = getOrCreateSessionId()
    const payload = JSON.stringify({
      provider_id: providerId,
      type: 'whatsapp_click',
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

    trackEvent('whatsapp_click', {
      provider_id: providerId,
      category_slug: categorySlug ?? undefined,
    })
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}
      aria-label={`Escribir a ${providerName} por WhatsApp`}
    >
      <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.522 5.854L.057 23.997l6.305-1.654A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.373l-.359-.213-3.72.976.993-3.63-.234-.372A9.818 9.818 0 1 1 12 21.818z" />
      </svg>
      {children ?? 'Escribir por WhatsApp'}
    </a>
  )
}
