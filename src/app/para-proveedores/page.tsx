import Link from 'next/link'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Para proveedores de eventos',
  description:
    'Crea tu perfil profesional en Planneo: quienes organizan bodas, XV años y eventos en Monterrey te escriben directo a tu WhatsApp.',
  path: '/para-proveedores',
})

const BENEFITS = [
  {
    title: 'Te encuentran por lo que haces',
    body: 'Apareces en el catálogo por categoría, zona y tipo de evento, no perdido en una búsqueda.',
  },
  {
    title: 'Cotiza por WhatsApp',
    body: 'El cliente te escribe directo a tu WhatsApp, con el nombre de tu negocio ya en el mensaje. Sin formularios, sin intermediarios, sin esperar a que te devolvamos el lead.',
  },
  {
    title: 'Tu perfil se completa por partes',
    body: 'Empiezas con cuatro datos y agregas fotos, paquetes y disponibilidad cuando puedas.',
  },
]

const STEPS = [
  { n: '1', title: 'Crea tu borrador', body: 'Nombre del negocio, servicio, zona y correo. Sin contraseña.' },
  { n: '2', title: 'Completa lo esencial', body: 'Una foto, una descripción y los tipos de evento que atiendes.' },
  { n: '3', title: 'Publica y recibe mensajes', body: 'Revisamos tu perfil y lo activamos en el catálogo. Los clientes te escriben a tu WhatsApp.' },
]

export default function ParaProveedoresPage() {
  return (
    <div className="min-h-screen bg-planneo-950">
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="text-center">
          <Link href="/" className="mb-6 inline-block">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Que te encuentren quienes ya están organizando su evento
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Planneo conecta a proveedores de Monterrey con personas que buscan fotografía, banquete,
            música, decoración, belleza y salones. Crear tu perfil es gratis.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/registrarme"
              className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-md bg-planneo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
            >
              Crear mi perfil gratis
            </Link>
            <p className="text-xs text-white/45">Toma unos 2 minutos. No pedimos contraseña.</p>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-sm font-semibold text-white">{b.title}</h2>
              <p className="mt-1.5 text-sm text-white/55">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-center text-lg font-semibold text-white">Cómo funciona</h2>
          <ol className="mt-6 flex flex-col gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-planneo-600/25 text-sm font-semibold text-planneo-300">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-white/55">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Entrada discreta: quien ya recibió un enlace de Planneo llega por ahí,
            no por el registro desde cero. */}
        <div className="mt-16 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="text-sm text-white/60">
            ¿Planneo ya preparó tu perfil y te envió un enlace? Ábrelo desde ese correo para
            reclamarlo en un paso.
          </p>
          <p className="mt-2 text-xs text-white/40">
            ¿No lo encuentras? Escríbenos a{' '}
            <a href="mailto:hola@planneo.mx" className="underline hover:text-white/60">
              hola@planneo.mx
            </a>
          </p>
        </div>

        <p className="mt-10 text-center text-sm text-white/45">
          ¿Organizas un evento?{' '}
          <Link href="/catalogo" className="text-planneo-300 transition-colors hover:text-white">
            Explora el catálogo
          </Link>
        </p>
      </div>
    </div>
  )
}
