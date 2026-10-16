import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { homeForRole } from '@/lib/auth-routes'
import { isOrganizerAccountsEnabled } from '@/lib/feature-flags'
import LoginForm from './_form'
import { safeNextPath } from './_next'

/**
 * Un solo modelo de acceso para todos (proveedores y admins): correo → código
 * de 6 dígitos. Ya no hay contraseña ni pantalla de recuperación.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next: rawNext } = await searchParams
  const next = safeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext) ?? undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(next ?? homeForRole(user.app_metadata?.role))

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-planneo-950 px-4 text-planneo-ink">
      <div className="absolute left-[12%] top-[12%] h-56 w-56 rounded-full bg-planneo-600/35 blur-3xl" />
      <div className="absolute bottom-[15%] right-[10%] h-64 w-64 rounded-full bg-planneo-300/20 blur-3xl" />
      <div className="v4-glass relative w-full max-w-sm rounded-lg p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="mb-8 text-center">
          <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
            Planneo
          </span>
          <p className="mt-2 text-sm text-white/55">Inicia sesión con tu correo</p>
        </div>

        <LoginForm next={next} />

        <div className="mt-6 flex flex-col gap-1.5 text-center text-xs text-white/45">
          {isOrganizerAccountsEnabled() && (
            <p>
              ¿Organizas un evento?{' '}
              <Link href="/crear-cuenta" className="text-planneo-300 hover:text-white transition-colors">
                Crea tu cuenta
              </Link>
            </p>
          )}
          <p>
            ¿Ofreces servicios?{' '}
            <Link href="/registrarme" className="text-planneo-300 hover:text-white transition-colors">
              Registra tu negocio
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
