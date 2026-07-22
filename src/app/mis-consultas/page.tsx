import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/landing/Navbar'
import { EVENT_TYPES, INQUIRY_STATUS_LABELS } from '@/lib/constants'
import type { Category, InquiryWithMessages, Provider } from '@/lib/types'
import { CalendarIcon, MapPinIcon, InboxIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mis consultas | Planneo',
  robots: { index: false, follow: false },
}

type InquiryRow = InquiryWithMessages & {
  providers: (Pick<Provider, 'name' | 'slug'> & { categories: Pick<Category, 'name' | 'slug'> | null }) | null
}

export default async function MisConsultasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/mis-consultas')

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, inquiry_messages(*), providers(name, slug, categories(name, slug))')
    .eq('client_user_id', user.id)
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'inquiry_messages', ascending: true })
    .returns<InquiryRow[]>()

  return (
    <div className="min-h-screen bg-planneo-950 text-planneo-ink">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="v4-display text-3xl font-bold tracking-[-0.04em] text-white">Mis consultas</h1>
          <p className="text-sm text-white/55 mt-0.5">
            Tus solicitudes de cotización y las respuestas de los proveedores.
          </p>
        </div>

        {(inquiries ?? []).length === 0 ? (
          <div className="bg-planneo-900 rounded-2xl border border-white/10 p-10 text-center">
            <div className="mb-3 flex justify-center text-planneo-300"><InboxIcon className="size-8" /></div>
            <p className="text-sm text-white/55 mb-4">
              Aún no has enviado consultas. Explora el catálogo y pide cotización al proveedor que te interese.
            </p>
            <Link
              href="/proveedores"
              className="inline-block rounded-xl bg-planneo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-planneo-500 transition-colors"
            >
              Buscar proveedores
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {(inquiries ?? []).map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function InquiryCard({ inquiry }: { inquiry: InquiryRow }) {
  const eventLabel = EVENT_TYPES.find((e) => e.value === inquiry.event_type)?.label
  const lastMessage = inquiry.inquiry_messages.at(-1)
  const isConfirmed = inquiry.status === 'confirmed'

  return (
    <li>
      <Link
        href={`/consulta/${inquiry.access_token}`}
        className={`block bg-planneo-900 rounded-2xl border p-5 hover:shadow-sm transition-shadow ${
          isConfirmed ? 'border-planneo-mint/30' : 'border-white/10'
        }`}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {inquiry.providers?.name ?? 'Proveedor'}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {inquiry.providers?.categories?.name ?? ''}
              {eventLabel ? ` · ${eventLabel}` : ''}
            </p>
          </div>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isConfirmed ? 'bg-planneo-mint text-planneo-950' : 'bg-white/10 text-white/55'
            }`}
          >
            {INQUIRY_STATUS_LABELS[inquiry.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/60">
          {inquiry.event_date && (
            <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
              <CalendarIcon /> {formatDateOnly(inquiry.event_date)}
            </span>
          )}
          {inquiry.event_location && (
            <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
              <MapPinIcon /> {inquiry.event_location}
            </span>
          )}
        </div>

        <p className="text-xs text-white/55 mt-3 line-clamp-2">
          {lastMessage
            ? `${lastMessage.sender === 'provider' ? 'Proveedor' : 'Tú'}: ${lastMessage.body}`
            : inquiry.message}
        </p>
      </Link>
    </li>
  )
}

function formatDateOnly(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
