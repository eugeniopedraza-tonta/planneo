import Link from 'next/link'

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-planneo-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-planneo-600/20 p-5">
            <svg className="w-10 h-10 text-planneo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          ¡Solicitud enviada!
        </h1>
        <p className="text-white/60 mb-2">
          Revisaremos tu información en las próximas <strong className="text-white/80">24–48 horas</strong>.
        </p>
        <p className="text-white/60 mb-8">
          Cuando tu perfil sea aprobado recibirás un email con el acceso a tu panel.
        </p>

        <Link
          href="/proveedores"
          className="inline-flex items-center gap-2 rounded-xl bg-planneo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-planneo-500 transition-colors"
        >
          Ver el catálogo
        </Link>
      </div>
    </div>
  )
}
