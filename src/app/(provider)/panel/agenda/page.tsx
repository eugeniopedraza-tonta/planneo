import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPES } from '@/lib/constants'
import type { Inquiry } from '@/lib/types'
import { CalendarIcon, MapPinIcon, UsersIcon, PhoneIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('claimed_by', user.id)
    .maybeSingle()

  if (!provider) {
    return (
      <div className="p-8">
        <p className="text-sm text-white/55">Tu cuenta no tiene un perfil vinculado.</p>
      </div>
    )
  }

  const { data: bookings } = await supabase
    .from('inquiries')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('status', 'confirmed')
    .order('event_date', { ascending: true, nullsFirst: false })
    .returns<Inquiry[]>()

  const today = todayLocalISO()
  const upcoming = (bookings ?? []).filter((b) => !b.event_date || b.event_date >= today)
  const past = (bookings ?? []).filter((b) => b.event_date && b.event_date < today).reverse()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Agenda</h1>
        <p className="text-sm text-white/55 mt-0.5">
          Tus eventos confirmados: con quién, dónde y cuándo tienes que presentarte.
        </p>
      </div>

      {(bookings ?? []).length === 0 ? (
        <div className="bg-planneo-900 rounded-2xl border border-white/10 p-10 text-center">
          <div className="mb-3 flex justify-center text-planneo-300"><CalendarIcon className="size-8" /></div>
          <p className="text-sm text-white/55">
            Aún no tienes eventos confirmados. Cuando confirmes una reservación desde{' '}
            <Link href="/panel/consultas" className="text-planneo-300 hover:underline">
              Consultas
            </Link>
            , aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-sm font-semibold text-white/55 uppercase tracking-wide mb-3">
              Próximos eventos
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-white/50">No tienes eventos próximos.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-white/55 uppercase tracking-wide mb-3">
                Eventos pasados
              </h2>
              <ul className="flex flex-col gap-3">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} past />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, past }: { booking: Inquiry; past?: boolean }) {
  const eventLabel = EVENT_TYPES.find((e) => e.value === booking.event_type)?.label

  return (
    <li className={`bg-planneo-900 rounded-2xl border p-5 ${past ? 'border-white/10 opacity-70' : 'border-planneo-mint/30'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{booking.name}</h3>
          {eventLabel && <p className="text-xs text-white/55 mt-0.5">{eventLabel}</p>}
        </div>
        {booking.event_date && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              past ? 'bg-white/10 text-white/55' : 'bg-planneo-mint/10 text-planneo-mint'
            }`}
          >
            <CalendarIcon /> {formatDateOnly(booking.event_date)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/60">
        {booking.event_location && (
          <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
            <MapPinIcon /> {booking.event_location}
          </span>
        )}
        {booking.guest_count != null && (
          <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
            <UsersIcon /> {booking.guest_count} invitados
          </span>
        )}
        {booking.phone && (
          <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
            <PhoneIcon /> {booking.phone}
          </span>
        )}
        {booking.email && (
          <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
            ✉️ {booking.email}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <Link href="/panel/consultas" className="text-xs font-medium text-planneo-300 hover:underline">
          Ver conversación en Consultas →
        </Link>
      </div>
    </li>
  )
}

function todayLocalISO(): string {
  // Fecha local del servidor en formato YYYY-MM-DD, comparable con event_date.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateOnly(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
