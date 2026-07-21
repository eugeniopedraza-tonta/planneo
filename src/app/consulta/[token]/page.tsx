import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { INQUIRY_STATUS_LABELS, EVENT_TYPES } from '@/lib/constants'
import type { Category, InquiryMessage, InquiryWithMessages, Provider } from '@/lib/types'
import ClientReplyForm from './_reply-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tu consulta | Planneo',
  robots: { index: false, follow: false },
}

type InquiryView = InquiryWithMessages & {
  providers: (Pick<Provider, 'name' | 'slug' | 'zona'> & { categories: Pick<Category, 'name' | 'slug'> | null }) | null
}

export default async function ConsultaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ enviada?: string }>
}) {
  const { token } = await params
  const { enviada } = await searchParams

  if (!z.string().uuid().safeParse(token).success) notFound()

  // Acceso por capability URL: el token identifica y autoriza al cliente.
  const service = createServiceClient()
  const { data: inquiry } = await service
    .from('inquiries')
    .select('*, inquiry_messages(*), providers(name, slug, zona, categories(name, slug))')
    .eq('access_token', token)
    .order('created_at', { referencedTable: 'inquiry_messages', ascending: true })
    .maybeSingle<InquiryView>()

  if (!inquiry) notFound()

  // Si quien abre el enlace es el dueño de la consulta (cliente con cuenta),
  // le damos acceso rápido a su historial.
  const authed = await createClient()
  const { data: { user } } = await authed.auth.getUser()

  // El token es la capacidad de acceso: si un usuario con sesión abre una
  // consulta sin dueño, la ligamos a su cuenta para que aparezca en su historial.
  const role = user?.app_metadata?.role
  if (user && !inquiry.client_user_id && (role === 'client' || !role)) {
    await service.from('inquiries').update({ client_user_id: user.id }).eq('id', inquiry.id)
    inquiry.client_user_id = user.id
  }

  const isOwner = !!user && user.id === inquiry.client_user_id

  const provider = inquiry.providers
  const eventLabel = EVENT_TYPES.find((e) => e.value === inquiry.event_type)?.label

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#7C3AED]">Planneo</Link>
          <div className="flex items-center gap-3">
            {isOwner && (
              <Link href="/mis-consultas" className="text-xs font-medium text-[#7C3AED] hover:underline">
                ← Mis consultas
              </Link>
            )}
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {INQUIRY_STATUS_LABELS[inquiry.status]}
            </span>
          </div>
        </div>

        {inquiry.status === 'confirmed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="text-sm font-medium text-emerald-800">¡Tu reservación está confirmada!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {provider?.name ?? 'El proveedor'} confirmó tu evento
              {inquiry.event_date ? ` para el ${formatDateOnly(inquiry.event_date)}` : ''}
              {inquiry.event_location ? ` en ${inquiry.event_location}` : ''}.
            </p>
          </div>
        )}

        {enviada && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="text-sm font-medium text-emerald-800">¡Tu solicitud fue enviada!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Guarda este enlace: aquí recibirás la cotización y podrás responder.
              {inquiry.email ? ' También te lo enviamos por email.' : ''}
            </p>
          </div>
        )}

        {/* Encabezado de la consulta */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cotización con</p>
          <div className="flex items-center justify-between gap-3 mt-1 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900">{provider?.name ?? 'Proveedor'}</h1>
            {provider?.categories?.slug && (
              <Link
                href={`/${provider.categories.slug}/${provider.slug}`}
                className="text-xs font-medium text-[#7C3AED] hover:underline"
              >
                Ver perfil →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-600">
            {eventLabel && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">{eventLabel}</span>
            )}
            {inquiry.event_date && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                📅 {formatDateOnly(inquiry.event_date)}
              </span>
            )}
            {inquiry.event_location && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                📍 {inquiry.event_location}
              </span>
            )}
            {inquiry.guest_count != null && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                👥 {inquiry.guest_count} invitados
              </span>
            )}
          </div>
        </div>

        {/* Hilo */}
        <div className="flex flex-col gap-3">
          <MessageBubble
            sender="client"
            name={inquiry.name}
            body={inquiry.message ?? ''}
            createdAt={inquiry.created_at}
          />
          {inquiry.inquiry_messages.map((m) => (
            <MessageBubble
              key={m.id}
              sender={m.sender}
              name={m.sender === 'provider' ? provider?.name ?? 'Proveedor' : inquiry.name}
              body={m.body}
              quoteAmount={m.quote_amount}
              createdAt={m.created_at}
            />
          ))}
          {inquiry.inquiry_messages.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-2">
              El proveedor aún no responde. Te avisaremos{inquiry.email ? ' por email' : ''} cuando lo haga.
            </p>
          )}
        </div>

        {/* Respuesta del cliente */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <ClientReplyForm token={token} />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  sender,
  name,
  body,
  quoteAmount,
  createdAt,
}: {
  sender: InquiryMessage['sender']
  name: string
  body: string
  quoteAmount?: number | null
  createdAt: string
}) {
  const isProvider = sender === 'provider'
  return (
    <div className={`flex ${isProvider ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isProvider
            ? 'bg-white border border-gray-200'
            : 'bg-[#7C3AED] text-white'
        }`}
      >
        <p className={`text-[11px] font-medium mb-1 ${isProvider ? 'text-gray-400' : 'text-white/70'}`}>
          {name} · {formatDateTime(createdAt)}
        </p>
        {quoteAmount != null && (
          <p className={`text-lg font-bold mb-1 ${isProvider ? 'text-[#7C3AED]' : ''}`}>
            ${Number(quoteAmount).toLocaleString('es-MX')} MXN
          </p>
        )}
        <p className="text-sm whitespace-pre-line">{body}</p>
      </div>
    </div>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

function formatDateOnly(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
