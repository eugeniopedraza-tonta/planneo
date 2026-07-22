import Link from 'next/link'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import ClientRegisterForm from './_form'

export const metadata = {
  title: 'Crea tu cuenta — Planneo',
  description: 'Guarda tus consultas y cotizaciones de proveedores de eventos en un solo lugar.',
}

export default async function CrearCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = z.string().startsWith('/').max(500).safeParse(next).success ? next : undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(safeNext ?? '/mis-consultas')

  return (
    <div className="min-h-screen bg-planneo-950 px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-3xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Crea tu cuenta
          </h1>
          <p className="text-white/55">
            Guarda tus consultas, recibe cotizaciones y da seguimiento a tus proveedores en un solo lugar.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <ClientRegisterForm next={safeNext} />
        </div>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-white/50">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-planneo-300 hover:text-white transition-colors">
              Inicia sesión
            </Link>
          </p>
          <p>
            ¿Ofreces servicios para eventos?{' '}
            <Link href="/registrarme" className="text-planneo-300 hover:text-white transition-colors">
              Registra tu negocio
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
