import Link from 'next/link'
import { connection } from 'next/server'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, ZONA_OPTIONS, sortByCategoryTree } from '@/lib/constants'
import RegisterForm from './_form'
import { isOrganizerAccountsEnabled } from '@/lib/feature-flags'

export const metadata = {
  title: 'Registra tu negocio — Planneo',
  description: 'Únete al catálogo de proveedores de eventos en Monterrey.',
}

export default async function RegistrarmePage() {
  // Se renderiza por request. Antes la página se prerenderizaba en el build y
  // `categories ?? []` se tragaba cualquier fallo: si la consulta no traía
  // filas en ese momento, el formulario salía para siempre sin opciones de
  // servicio y todo registro fallaba con category_id = null (PLA-5).
  await connection()

  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('slug', CATEGORY_SLUGS as unknown as string[])

  const categories = sortByCategoryTree(data ?? [])
  if (error || categories.length === 0) {
    console.error('[registrarme] categorías no disponibles', error)
  }

  return (
    <div className="min-h-screen bg-planneo-950 px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-3xl font-bold text-transparent">
              Planneo
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Crea tu perfil profesional en Planneo
          </h1>
          <p className="text-white/55">
            Es gratis. Empieza en 2 minutos y completa lo demás cuando quieras.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          {categories.length > 0 ? (
            <RegisterForm categories={categories} zonas={[...ZONA_OPTIONS]} />
          ) : (
            <p role="alert" className="text-center text-sm text-white/70">
              No pudimos cargar la lista de servicios. Recarga la página en un momento o escríbenos a{' '}
              <a href="mailto:hola@planneo.mx" className="text-planneo-300 underline">hola@planneo.mx</a>.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-white/50">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-planneo-300 hover:text-white transition-colors">
              Inicia sesión
            </Link>
          </p>
          <p>
            ¿Planneo te envió una invitación?{' '}
            <Link href="/reclamar" className="text-planneo-300 hover:text-white transition-colors">
              Úsala aquí
            </Link>
          </p>
          {isOrganizerAccountsEnabled() && (
            <p>
              ¿Organizas un evento y buscas proveedores?{' '}
              <Link href="/crear-cuenta" className="text-planneo-300 hover:text-white transition-colors">
                Crea tu cuenta de cliente
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
