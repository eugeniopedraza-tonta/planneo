import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckCircleIcon, ClockIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Perfil enviado',
  robots: { index: false, follow: false },
}

/**
 * Pantalla final compartida por las dos políticas de publicación: el estado
 * real del perfil decide el copy, no una bandera del cliente.
 */
export default async function ListoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: provider } = await supabase
    .from('providers')
    .select('name, slug, status, categories(slug)')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (!provider) redirect('/registrarme')

  const isPublished = provider.status === 'published'
  const categorySlug = (provider.categories as unknown as { slug: string } | null)?.slug
  const publicUrl = categorySlug ? `/${categorySlug}/${provider.slug}` : '/catalogo'

  return (
    <div className="max-w-xl p-6 sm:p-8">
      <div className="rounded-lg border border-white/10 bg-planneo-900 p-8 text-center">
        <div className="mb-4 flex justify-center text-planneo-mint">
          {isPublished ? <CheckCircleIcon className="size-10" /> : <ClockIcon className="size-10" />}
        </div>

        <h1 className="text-xl font-semibold text-white">
          {isPublished ? 'Tu perfil ya está activo' : 'Tu perfil está en revisión'}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {isPublished
            ? 'Las personas podrán conocer tu servicio y enviarte una cotización desde Planneo.'
            : 'Lo revisamos en las próximas 24–48 horas y te avisamos por correo en cuanto quede activo.'}
        </p>

        <div className="mt-7 flex flex-col gap-2">
          {isPublished && (
            <Link
              href={publicUrl}
              className="rounded-md bg-planneo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-planneo-500"
            >
              Ver mi perfil público
            </Link>
          )}
          <Link
            href="/panel/paquetes"
            className={`rounded-md py-3 text-sm font-semibold transition-colors ${
              isPublished
                ? 'border border-white/15 text-white/75 hover:border-white/30'
                : 'bg-planneo-600 text-white hover:bg-planneo-500'
            }`}
          >
            Agregar mi primer paquete
          </Link>
          <Link
            href="/panel"
            className="py-2 text-xs text-white/45 underline hover:text-white/70"
          >
            Ir a mi panel
          </Link>
        </div>
      </div>
    </div>
  )
}
