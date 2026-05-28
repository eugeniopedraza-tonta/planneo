import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'

export const metadata: Metadata = {
  title: 'Privacidad — Planneo',
  description: 'Aviso de privacidad básico de Planneo.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0E0B1A] px-4 py-24 text-[#F5F0FF] sm:px-6 lg:px-8">
      <Navbar />
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#C77DFF]">← Volver</Link>
        <h1 className="v4-display mt-8 text-5xl font-bold tracking-[-0.04em]">Privacidad</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>
            Usamos la información que compartes para operar Planneo: crear cuentas, mostrar perfiles,
            generar links de reclamación, registrar leads y mejorar la experiencia de búsqueda.
          </p>
          <p>
            Si eres proveedor, tu información pública puede incluir nombre comercial, categoría, zona,
            descripción, fotos, Instagram y WhatsApp.
          </p>
          <p>
            No vendemos datos personales. Podemos usar métricas agregadas de navegación y contacto para
            entender qué categorías y proveedores generan más interés.
          </p>
          <p>
            Para corregir o eliminar información de un perfil, contacta al equipo de Planneo o accede a
            tu panel si ya reclamaste tu perfil.
          </p>
        </div>
      </article>
    </main>
  )
}
