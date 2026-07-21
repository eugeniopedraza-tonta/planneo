import Link from 'next/link'
import RecoverPasswordForm from './_form'

export const metadata = {
  title: 'Recuperar contraseña — Planneo',
  robots: { index: false, follow: false },
}

export default function RecuperarPage() {
  return (
    <div className="min-h-screen bg-[#0E0B1A] px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-3xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Recupera tu contraseña
          </h1>
          <p className="text-white/55">
            Te enviaremos un código de 6 dígitos a tu correo para restablecerla.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <RecoverPasswordForm />
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          ¿La recordaste?{' '}
          <Link href="/login" className="text-[#C77DFF] hover:text-white transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
