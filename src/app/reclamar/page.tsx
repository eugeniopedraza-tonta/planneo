import Link from 'next/link'
import ClaimInviteForm from './_form'

export const metadata = {
  title: 'Usa tu invitación',
  robots: { index: false, follow: false },
}

/**
 * Entrada para quien recibió una invitación pero no tiene el enlace a la mano
 * (o llegó desde "¿Planneo te envió una invitación?" en /registrarme). El
 * reclamo real sigue viviendo en /reclamar/[token].
 */
export default function ReclamarIndexPage() {
  return (
    <div className="min-h-screen bg-planneo-950 px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Usa tu invitación
          </h1>
          <p className="text-white/55">
            Si Planneo ya preparó el perfil de tu negocio, pega aquí el enlace que te enviamos para activarlo.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <ClaimInviteForm />
        </div>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-white/50">
          <p>
            ¿No tienes invitación?{' '}
            <Link href="/registrarme" className="text-planneo-300 hover:text-white transition-colors">
              Registra tu negocio
            </Link>
          </p>
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-planneo-300 hover:text-white transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
