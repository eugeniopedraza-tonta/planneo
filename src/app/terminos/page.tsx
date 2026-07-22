import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'

export const metadata: Metadata = {
  title: 'Términos de uso — Planneo',
  description: 'Términos básicos de uso de Planneo para organizadores y proveedores.',
  alternates: { canonical: '/terminos' },
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-planneo-950 px-4 py-24 text-planneo-ink sm:px-6 lg:px-8">
      <Navbar />
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-planneo-300">← Volver</Link>
        <h1 className="v4-display mt-8 text-5xl font-bold tracking-[-0.04em]">Términos de uso</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>
            Planneo es un directorio curado de proveedores para eventos. La plataforma facilita la
            búsqueda y el contacto, pero la contratación, disponibilidad, precios y condiciones finales
            se acuerdan directamente entre el organizador y el proveedor.
          </p>
          <p>
            Al usar Planneo aceptas proporcionar información verdadera y usar los datos de contacto solo
            para cotizar servicios relacionados con eventos.
          </p>
          <p>
            Los proveedores son responsables de mantener actualizada la información de su perfil,
            incluyendo fotos, descripción, zona de atención y datos de contacto.
          </p>
          <p>
            Planneo puede registrar vistas de perfil y clicks a WhatsApp para mejorar el catálogo y
            mostrar métricas a proveedores y administradores.
          </p>
        </div>
      </article>
    </main>
  )
}
