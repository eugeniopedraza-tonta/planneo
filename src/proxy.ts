import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canAccessProviderPanel } from '@/lib/auth-routes'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname.startsWith('/mi-perfil') || pathname.startsWith('/panel')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!canAccessProviderPanel(user.app_metadata?.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname.startsWith('/mis-consultas') && !user) {
    return NextResponse.redirect(new URL('/login?next=/mis-consultas', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
