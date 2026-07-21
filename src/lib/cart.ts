/**
 * Carrito de evento — vive SOLO en el navegador (localStorage) hasta el envío.
 * El único punto de entrada al servidor es la Server Action de envío (Sprint 8),
 * que crea el Evento + una cotización por proveedor.
 */

export type CartItem = {
  providerId: string
  providerName: string
  providerSlug: string
  categorySlug: string
  packageId: string
  packageName: string
  priceFrom: number | null
  priceTo: number | null
}

export type CartEvent = {
  eventType: string
  eventDate: string // YYYY-MM-DD
  guestCount: number | null
  eventLocation: string | null
}

export type Cart = {
  event: CartEvent | null
  items: CartItem[]
}

const STORAGE_KEY = 'planneo.cart.v1'
const CHANGE_EVENT = 'planneo:cart-change'

const EMPTY: Cart = { event: null, items: [] }

export function readCart(): Cart {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Cart
    if (!Array.isArray(parsed.items)) return EMPTY
    return { event: parsed.event ?? null, items: parsed.items }
  } catch {
    return EMPTY
  }
}

function writeCart(cart: Cart) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function addCartItem(item: CartItem): Cart {
  const cart = readCart()
  const items = cart.items.some((i) => i.packageId === item.packageId)
    ? cart.items
    : [...cart.items, item]
  const next = { ...cart, items }
  writeCart(next)
  return next
}

export function removeCartItem(packageId: string): Cart {
  const cart = readCart()
  const next = { ...cart, items: cart.items.filter((i) => i.packageId !== packageId) }
  writeCart(next)
  return next
}

export function setCartEvent(event: CartEvent): Cart {
  const next = { ...readCart(), event }
  writeCart(next)
  return next
}

export function clearCart() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Suscripción a cambios del carrito (misma pestaña y otras pestañas). */
export function subscribeToCart(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}
