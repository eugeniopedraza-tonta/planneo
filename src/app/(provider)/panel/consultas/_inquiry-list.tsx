'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EVENT_TYPES, INQUIRY_STATUS_LABELS } from '@/lib/constants'
import type { InquiryStatus, InquiryWithMessages } from '@/lib/types'
import { confirmBooking, replyToInquiry, updateInquiryStatus, type ConfirmState, type ReplyState } from './_actions'

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-[#7C3AED]/10 text-[#7C3AED]',
  read: 'bg-sky-50 text-sky-700',
  replied: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-emerald-600 text-white',
  closed: 'bg-gray-100 text-gray-500',
}

export default function InquiryList({ inquiries }: { inquiries: InquiryWithMessages[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  function setStatus(inquiry: InquiryWithMessages, status: InquiryStatus) {
    if (inquiry.status === status) return
    startTransition(async () => {
      const res = await updateInquiryStatus(inquiry.id, status)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  if (inquiries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <p className="text-3xl mb-2">📬</p>
        <p className="text-sm text-gray-500">
          Aún no tienes consultas. Cuando alguien pida cotización desde tu perfil, aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {inquiries.map((inquiry) => (
        <li
          key={inquiry.id}
          className={`bg-white rounded-2xl border p-5 ${
            inquiry.status === 'new' ? 'border-[#7C3AED]/30' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-gray-900">{inquiry.name}</h2>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inquiry.status]}`}>
                  {INQUIRY_STATUS_LABELS[inquiry.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(inquiry.created_at)}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['read', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isPending || inquiry.status === s}
                  onClick={() => setStatus(inquiry, s)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors disabled:opacity-50 ${
                    inquiry.status === s
                      ? 'border-transparent ' + STATUS_STYLES[s]
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s === 'read' ? 'Marcar leída' : 'Cerrar'}
                </button>
              ))}
            </div>
          </div>

          {/* Datos del evento y contacto (informativos; la conversación vive aquí) */}
          <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-gray-600">
            {inquiry.event_type && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                {EVENT_TYPES.find((e) => e.value === inquiry.event_type)?.label ?? inquiry.event_type}
              </span>
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
            {inquiry.phone && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                📞 {inquiry.phone}
              </span>
            )}
            {inquiry.email && (
              <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                ✉️ {inquiry.email}
              </span>
            )}
          </div>

          {/* Hilo de conversación */}
          <div className="mt-3 flex flex-col gap-2">
            {inquiry.message && (
              <ThreadMessage who={inquiry.name} body={inquiry.message} at={inquiry.created_at} isProvider={false} />
            )}
            {inquiry.inquiry_messages.map((m) => (
              <ThreadMessage
                key={m.id}
                who={m.sender === 'provider' ? 'Tú' : inquiry.name}
                body={m.body}
                quoteAmount={m.quote_amount}
                at={m.created_at}
                isProvider={m.sender === 'provider'}
              />
            ))}
          </div>

          {/* Responder con cotización / confirmar reservación */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            {replyingTo === inquiry.id ? (
              <ReplyForm
                inquiryId={inquiry.id}
                onDone={() => {
                  setReplyingTo(null)
                  router.refresh()
                }}
                onCancel={() => setReplyingTo(null)}
              />
            ) : confirmingId === inquiry.id ? (
              <ConfirmBookingForm
                inquiry={inquiry}
                onDone={() => {
                  setConfirmingId(null)
                  router.refresh()
                }}
                onCancel={() => setConfirmingId(null)}
              />
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReplyingTo(inquiry.id)}
                  className="text-xs font-medium text-[#7C3AED] hover:underline"
                >
                  {inquiry.inquiry_messages.length > 0 ? 'Responder de nuevo' : 'Responder con cotización'}
                </button>
                {inquiry.status !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(inquiry.id)}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Confirmar reservación
                  </button>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function ThreadMessage({
  who,
  body,
  quoteAmount,
  at,
  isProvider,
}: {
  who: string
  body: string
  quoteAmount?: number | null
  at: string
  isProvider: boolean
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${
        isProvider ? 'bg-[#7C3AED]/5 border border-[#7C3AED]/15 ml-6' : 'bg-gray-50 border border-gray-100 mr-6'
      }`}
    >
      <p className="text-[11px] font-medium text-gray-400 mb-0.5">
        {who} · {formatDate(at)}
      </p>
      {quoteAmount != null && (
        <p className="text-base font-bold text-[#7C3AED]">
          ${Number(quoteAmount).toLocaleString('es-MX')} MXN
        </p>
      )}
      <p className="text-gray-700 whitespace-pre-line">{body}</p>
    </div>
  )
}

function ReplyForm({
  inquiryId,
  onDone,
  onCancel,
}: {
  inquiryId: string
  onDone: () => void
  onCancel: () => void
}) {
  const action = replyToInquiry.bind(null, inquiryId)
  const [state, formAction, isPending] = useActionState<ReplyState, FormData>(action, {})
  const notified = useRef(false)

  useEffect(() => {
    if (state.success && !notified.current) {
      notified.current = true
      toast.success('Respuesta enviada al cliente.')
      onDone()
    }
  }, [state.success, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <textarea
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Escribe tu respuesta o cotización…"
        aria-label="Respuesta al cliente"
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`quote-${inquiryId}`} className="text-xs text-gray-500">
            Monto cotizado (opcional)
          </label>
          <input
            id={`quote-${inquiryId}`}
            name="quote_amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="$ MXN"
            className="w-28 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs font-medium text-gray-500 hover:underline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B2FD6] disabled:opacity-60"
          >
            {isPending ? 'Enviando…' : 'Enviar respuesta'}
          </button>
        </div>
      </div>
    </form>
  )
}

function ConfirmBookingForm({
  inquiry,
  onDone,
  onCancel,
}: {
  inquiry: InquiryWithMessages
  onDone: () => void
  onCancel: () => void
}) {
  const action = confirmBooking.bind(null, inquiry.id)
  const [state, formAction, isPending] = useActionState<ConfirmState, FormData>(action, {})
  const notified = useRef(false)

  useEffect(() => {
    if (state.success && !notified.current) {
      notified.current = true
      toast.success('Reservación confirmada. La fecha quedó bloqueada en tu calendario.')
      onDone()
    }
  }, [state.success, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <p className="text-xs text-gray-500">
        Al confirmar, el evento pasa a tu agenda y la fecha se marca como reservada en tu calendario.
      </p>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <label htmlFor={`confirm-date-${inquiry.id}`} className="text-xs text-gray-500">
            Fecha del evento *
          </label>
          <input
            id={`confirm-date-${inquiry.id}`}
            name="event_date"
            type="date"
            required
            defaultValue={inquiry.event_date ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-40">
          <label htmlFor={`confirm-location-${inquiry.id}`} className="text-xs text-gray-500">
            Lugar del evento
          </label>
          <input
            id={`confirm-location-${inquiry.id}`}
            name="event_location"
            maxLength={300}
            defaultValue={inquiry.event_location ?? ''}
            placeholder="Salón, dirección o zona"
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs font-medium text-gray-500 hover:underline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? 'Confirmando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </form>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function formatDateOnly(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
