import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPES } from '@/lib/constants'
import type { Inquiry } from '@/lib/types'

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
        <p className="text-sm text-gray-500">Tu cuenta no tiene un perfil vinculado.</p>
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
        <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tus eventos confirmados: con quién, dónde y cuándo tienes que presentarte.
        </p>
      </div>

      {(bookings ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="text-sm text-gray-500">
            Aún no tienes eventos confirmados. Cuando confirmes una reservación desde{' '}
            <Link href="/panel/consultas" className="text-[#7C3AED] hover:underline">
              Consultas
            </Link>
            , aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Próximos eventos
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No tienes eventos próximos.</p>
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
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
    <li className={`bg-white rounded-2xl border p-5 ${past ? 'border-gray-200 opacity-70' : 'border-emerald-200'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{booking.name}</h3>
          {eventLabel && <p className="text-xs text-gray-500 mt-0.5">{eventLabel}</p>}
        </div>
        {booking.event_date && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              past ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            📅 {formatDateOnly(booking.event_date)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-gray-600">
        {booking.event_location && (
          <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
            📍 {booking.event_location}
          </span>
        )}
        {booking.guest_count != null && (
          <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
            👥 {booking.guest_count} invitados
          </span>
        )}
        {booking.phone && (
          <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
            📞 {booking.phone}
          </span>
        )}
        {booking.email && (
          <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
            ✉️ {booking.email}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Link href="/panel/consultas" className="text-xs font-medium text-[#7C3AED] hover:underline">
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
