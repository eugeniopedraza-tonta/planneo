declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Id de medición GA4. Sin él, todo el tracking de GA es un no-op. */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || ''

const SESSION_COOKIE = 'planneo_sid'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

/**
 * Asegura el stub estándar de gtag (dataLayer + gtag que encola) y el
 * `config` del id. Si un evento se dispara antes de que cargue gtag.js,
 * queda en dataLayer en orden (js → config → evento) y gtag.js lo procesa al
 * llegar. El script inline del layout llama lo mismo, así que no se duplica.
 */
function ensureGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === 'undefined' || !GA4_ID) return null
  if (typeof window.gtag === 'function') return window.gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js espera el objeto `arguments`, no un arreglo.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA4_ID)
  return window.gtag
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function uuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Navegadores sin randomUUID (contextos no seguros): v4 con getRandomValues.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Id de sesión anónimo (UUID v4) en la cookie `planneo_sid`, 30 días.
 * Lo comparten GA4 (param `planneo_session_id`) y el tracking de leads (/api/leads).
 * La primera vez que se genera dispara `session_start`.
 */
export function getOrCreateSessionId(): string {
  if (typeof document === 'undefined') return 'anon'
  try {
    const existing = readCookie(SESSION_COOKIE)
    if (existing) return existing
    const id = uuidV4()
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${SESSION_COOKIE}=${id}; Max-Age=${SESSION_MAX_AGE}; Path=/; SameSite=Lax${secure}`
    // Si el navegador bloquea cookies, no fingimos una sesión nueva en cada evento.
    if (readCookie(SESSION_COOKIE) !== id) return 'anon'
    sendEvent('session_start', id, {})
    return id
  } catch {
    return 'anon'
  }
}

function sendEvent(name: string, sessionId: string, params: Record<string, unknown>) {
  const gtag = ensureGtag()
  if (!gtag) return
  gtag('event', name, {
    ...params,
    event_category: 'marketplace',
    // `session_id` es un campo reservado de gtag: lo consume en silencio y no
    // llega como parámetro. Va con nombre propio (= cookie planneo_sid).
    planneo_session_id: sessionId,
  })
}

/**
 * Evento de GA4 desde el cliente. Agrega `event_category: "marketplace"` y
 * `planneo_session_id` (el id de la cookie planneo_sid). Nunca se mandan email,
 * teléfono, tokens ni nombres: solo dimensiones agregables (ids, categoría,
 * punto de entrada, duración).
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !GA4_ID) return
  sendEvent(name, getOrCreateSessionId(), params)
}

/** Script inline del layout: mismo stub que `ensureGtag`, antes de gtag.js. */
export function gtagInitScript(gaId: string): string {
  const id = JSON.stringify(gaId)
  return [
    'window.dataLayer=window.dataLayer||[];',
    'if(typeof window.gtag!=="function"){',
    'window.gtag=function gtag(){window.dataLayer.push(arguments);};',
    `window.gtag("js",new Date());window.gtag("config",${id});`,
    '}',
  ].join('')
}

/** Cubeta de tamaño de archivo, para reportar fallos de carga sin exponer el archivo. */
export function fileSizeBucket(bytes: number): string {
  if (bytes < 1_000_000) return '<1MB'
  if (bytes < 5_000_000) return '1-5MB'
  if (bytes < 10_000_000) return '5-10MB'
  return '>10MB'
}
