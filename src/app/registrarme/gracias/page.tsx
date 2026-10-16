import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingSession } from '@/lib/onboarding-session'
import { canAccessProviderPanel } from '@/lib/auth-routes'

export const metadata = {
  title: 'Registro recibido',
  robots: { index: false, follow: false },
}

/**
 * Confirmación del registro. El flujo normal ya no pasa por aquí (tras el
 * código se entra directo a /panel/onboarding), pero la ruta sobrevive por los
 * enlaces que salieron por correo. Antes redirigía al panel y, sin sesión, el
 * proxy terminaba mostrando el login bajo esta URL (PLA-16): ahora es una
 * pantalla propia que dice en qué punto del registro va la persona.
 */
export default async function GraciasPage() {
  const [session, supabase] = await Promise.all([getOnboardingSession(), createClient()])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasPanel = !!user && canAccessProviderPanel(user.app_metadata?.role)

  const content = hasPanel
    ? {
        title: 'Tu perfil ya está en Planneo',
        body: 'Tu correo quedó verificado y tu borrador está creado. Complétalo y publícalo cuando esté listo.',
        action: { href: '/panel/onboarding', label: 'Ir a mi panel' },
      }
    : session
      ? {
          title: 'Te falta un paso',
          body: `Te enviamos un código de 6 dígitos a ${session.email}. Escríbelo para crear tu borrador.`,
          action: { href: '/verificar-acceso', label: 'Escribir mi código' },
        }
      : {
          title: 'Gracias por registrarte',
          body: 'Entra con tu correo: te enviamos un código de acceso y sigues completando tu perfil donde lo dejaste.',
          action: { href: '/login?next=/panel/onboarding', label: 'Entrar con mi correo' },
        }

  return (
    <div className="flex min-h-screen items-center justify-center bg-planneo-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
        </div>

        <div className="rounded-lg border border-white/10 bg-planneo-900 p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-white">{content.title}</h1>
          <p className="mt-2 text-sm text-white/60">{content.body}</p>
          <Link
            href={content.action.href}
            className="mt-6 inline-flex w-full justify-center rounded-md bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
          >
            {content.action.label}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          ¿Dudas? Escríbenos a{' '}
          <a href="mailto:hola@planneo.mx" className="underline hover:text-white/70">
            hola@planneo.mx
          </a>
        </p>
      </div>
    </div>
  )
}
