import Link from 'next/link'
import { LinkIcon } from '@/components/icons'

export const metadata = {
  robots: { index: false, follow: false },
}

/**
 * Pantalla de ayuda. El reporte ya quedó registrado por la acción que trajo
 * aquí; esta vista es solo informativa para que recargarla no genere reportes
 * duplicados.
 */
export default function NoEsMioPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-planneo-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-planneo-900 p-8 text-center shadow-sm">
        <div className="mb-3 flex justify-center text-planneo-300">
          <LinkIcon className="size-8" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-white">Gracias por avisarnos</h1>
        <p className="text-sm text-white/60">
          No vinculamos este negocio a tu cuenta. Ya lo marcamos para que el equipo de Planneo lo
          revise.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/registrarme"
            className="rounded-xl bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
          >
            Crear el perfil de mi negocio
          </Link>
          <Link href="/" className="py-2 text-xs text-white/45 underline hover:text-white/70">
            Volver al inicio
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/40">
          ¿Dudas? Escríbenos a{' '}
          <a href="mailto:hola@planneo.mx" className="underline">hola@planneo.mx</a>
        </p>
      </div>
    </div>
  )
}
