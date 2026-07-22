'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EVENT_TYPES, INQUIRY_STATUS_LABELS } from '@/lib/constants'
import type { InquiryStatus, InquiryWithMessages } from '@/lib/types'
import { confirmBooking, replyToInquiry, updateInquiryStatus, type ConfirmState, type ReplyState } from './_actions'
import { CalendarIcon, MapPinIcon, UsersIcon, PhoneIcon, InboxIcon , MailIcon } from '@/components/icons'

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-planneo-600/20 text-planneo-300',
  read: 'bg-sky-300/10 text-sky-300',
  replied: 'bg-planneo-mint/10 text-planneo-mint',
  confirmed: 'bg-planneo-mint text-planneo-950',
  closed: 'bg-white/10 text-white/55',
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
      <div className="bg-planneo-900 rounded-2xl border border-white/10 p-10 text-center">
        <div className="mb-3 flex justify-center text-planneo-300"><InboxIcon className="size-8" /></div>
        <p className="text-sm text-white/55">
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
          className={`bg-planneo-900 rounded-2xl border p-5 ${
            inquiry.status === 'new' ? 'border-planneo-300/40' : 'border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-white">{inquiry.name}</h2>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inquiry.status]}`}>
                  {INQUIRY_STATUS_LABELS[inquiry.status]}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">{formatDate(inquiry.created_at)}</p>
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
                      : 'border-white/10 text-white/55 hover:bg-white/[0.07]'
                  }`}
                >
                  {s === 'read' ? 'Marcar leída' : 'Cerrar'}
                </button>
              ))}
            </div>
          </div>

          {/* Datos del evento y contacto (informativos; la conversación vive aquí) */}
          <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/60">
            {inquiry.event_type && (
              <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                {EVENT_TYPES.find((e) => e.value === inquiry.event_type)?.label ?? inquiry.event_type}
              </span>
            )}
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
            {inquiry.guest_count != null && (
              <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                <UsersIcon /> {inquiry.guest_count} invitados
              </span>
            )}
            {inquiry.phone && (
              <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                <PhoneIcon /> {inquiry.phone}
              </span>
            )}
            {inquiry.email && (
              <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                <MailIcon /> {inquiry.email}
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
          <div className="mt-3 pt-3 border-t border-white/10">
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
                  className="text-xs font-medium text-planneo-300 hover:underline"
                >
                  {inquiry.inquiry_messages.length > 0 ? 'Responder de nuevo' : 'Responder con cotización'}
                </button>
                {inquiry.status !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(inquiry.id)}
                    className="text-xs font-medium text-planneo-mint hover:underline"
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
        isProvider ? 'bg-planneo-600/10 border border-planneo-300/25 ml-6' : 'bg-white/[0.04] border border-white/10 mr-6'
      }`}
    >
      <p className="text-[11px] font-medium text-white/50 mb-0.5">
        {who} · {formatDate(at)}
      </p>
      {quoteAmount != null && (
        <p className="text-base font-bold text-planneo-300">
          ${Number(quoteAmount).toLocaleString('es-MX')} MXN
        </p>
      )}
      <p className="text-white/75 whitespace-pre-line">{body}</p>
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
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      <textarea
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Escribe tu respuesta o cotización…"
        aria-label="Respuesta al cliente"
        className="w-full text-sm border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-planneo-300/40"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`quote-${inquiryId}`} className="text-xs text-white/55">
            Monto cotizado (opcional)
          </label>
          <input
            id={`quote-${inquiryId}`}
            name="quote_amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="$ MXN"
            className="w-28 text-sm border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-planneo-300/40"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs font-medium text-white/55 hover:underline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-planneo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-planneo-500 disabled:opacity-60"
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
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      <p className="text-xs text-white/55">
        Al confirmar, el evento pasa a tu agenda y la fecha se marca como reservada en tu calendario.
      </p>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <label htmlFor={`confirm-date-${inquiry.id}`} className="text-xs text-white/55">
            Fecha del evento *
          </label>
          <input
            id={`confirm-date-${inquiry.id}`}
            name="event_date"
            type="date"
            required
            defaultValue={inquiry.event_date ?? ''}
            className="text-sm border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-planneo-mint/40"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-40">
          <label htmlFor={`confirm-location-${inquiry.id}`} className="text-xs text-white/55">
            Lugar del evento
          </label>
          <input
            id={`confirm-location-${inquiry.id}`}
            name="event_location"
            maxLength={300}
            defaultValue={inquiry.event_location ?? ''}
            placeholder="Salón, dirección o zona"
            className="text-sm border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-planneo-mint/40"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs font-medium text-white/55 hover:underline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-planneo-mint px-3 py-1.5 text-xs font-semibold text-planneo-950 hover:bg-[#33DFB1] disabled:opacity-60"
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
