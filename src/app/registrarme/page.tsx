import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, ZONA_OPTIONS, sortByCategoryTree } from '@/lib/constants'
import RegisterForm from './_form'
import { isOrganizerAccountsEnabled } from '@/lib/feature-flags'

export const metadata = {
  title: 'Registra tu negocio — Planneo',
  description: 'Únete al catálogo de proveedores de eventos en Monterrey.',
}

export default async function RegistrarmePage() {
  const supabase = createStaticClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('slug', CATEGORY_SLUGS as unknown as string[])

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
          <RegisterForm categories={sortByCategoryTree(categories ?? [])} zonas={[...ZONA_OPTIONS]} />
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
            <Link href="/para-proveedores" className="text-planneo-300 hover:text-white transition-colors">
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
