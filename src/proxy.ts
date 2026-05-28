import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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

  if (pathname.startsWith('/mi-perfil')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = user.app_metadata?.role
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
