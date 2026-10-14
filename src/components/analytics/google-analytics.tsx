import Script from 'next/script'
import { GA4_ID, gtagInitScript } from '@/lib/analytics'
import ProviderCardClickTracker from './provider-card-click-tracker'

/**
 * GA4 con next/script (afterInteractive). Sin NEXT_PUBLIC_GA4_ID no se
 * renderiza nada y `trackEvent` es un no-op.
 */
export default function GoogleAnalytics() {
  if (!GA4_ID) return null

  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {gtagInitScript(GA4_ID)}
      </Script>
      <Script
        id="ga4-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`}
        strategy="afterInteractive"
      />
      <ProviderCardClickTracker />
    </>
  )
}
