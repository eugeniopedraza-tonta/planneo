import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessProviderPanel } from '@/lib/auth-routes'
import { isOrganizerAccountsEnabled } from '@/lib/feature-flags'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    if (!user) return redirectToLogin(request)
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname.startsWith('/mi-perfil') || pathname.startsWith('/panel')) {
    if (!user) return redirectToLogin(request)
    if (!canAccessProviderPanel(user.app_metadata?.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Con el flag de cuentas de organizador apagado, /crear-cuenta y
  // /mis-consultas responden 404 desde la propia página (notFound()). Antes se
  // redirigían al home y la URL parecía servir el HTML de otra página.
  if (pathname.startsWith('/mis-consultas') && isOrganizerAccountsEnabled() && !user) {
    return redirectToLogin(request)
  }

  return response
}

/** Login conservando a dónde iba el usuario (`/login?next=/mi-perfil`). */
function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url)
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
