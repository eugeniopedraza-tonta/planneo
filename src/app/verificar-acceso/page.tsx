import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOnboardingSession } from '@/lib/onboarding-session'
import VerifyForm from './_form'

export const metadata = {
  title: 'Verifica tu acceso',
  robots: { index: false, follow: false },
}

export default async function VerificarAccesoPage() {
  const session = await getOnboardingSession()

  // Sin sesión de onboarding no hay nada que verificar: se vuelve al inicio del
  // flujo en lugar de mostrar un formulario que no puede funcionar.
  if (!session) redirect('/registrarme')

  const backHref = session.purpose === 'claim' ? `/reclamar/${session.token}` : '/registrarme'

  return (
    <div className="min-h-screen bg-planneo-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
            Planneo
          </span>
        </div>

        <div className="bg-planneo-900 rounded-2xl border border-white/10 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-white">Escribe tu código</h1>
          <p className="mt-1 text-sm text-white/60">
            Te enviamos un código de 6 dígitos a{' '}
            <span className="font-medium text-white/85">{session.email}</span>.
          </p>

          <VerifyForm />

          <p className="mt-5 text-center text-xs text-white/45">
            <Link href={backHref} className="underline hover:text-white/70">
              Usar otro correo
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
