import Link from 'next/link'
import Image from 'next/image'
import type { ProviderWithCategory } from '@/lib/types'
import { PRICE_RANGES } from '@/lib/constants'

interface ProviderCardProps {
  provider: ProviderWithCategory
}

const PRICE_LABEL: Record<string, string> = Object.fromEntries(
  PRICE_RANGES.map(({ value, label }) => [value, label])
)

const EVENT_LABEL: Record<string, string> = {
  bodas: 'Bodas',
  xv: 'XV Años',
  corporativo: 'Corporativo',
  graduacion: 'Graduación',
}

const CATEGORY_GRADIENT: Record<string, string> = {
  fotografia: 'from-[#26133F] via-planneo-600 to-planneo-300',
  belleza: 'from-[#3A1330] via-[#D8709B] to-[#F5C8D8]',
  musica: 'from-[#130F2F] via-[#5E17EB] to-planneo-mint',
  banquete: 'from-[#2A1B12] via-[#C98B5F] to-[#FFE1A8]',
  decoracion: 'from-[#123025] via-[#6AA884] to-[#E1F0C4]',
  salones: 'from-[#15203A] via-[#5E17EB] to-planneo-300',
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const photo = provider.photos?.[0] ?? null
  const categorySlug = provider.categories?.slug ?? '#'
  const href = `/${categorySlug}/${provider.slug}`

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
    >
      {/* Foto / arte de categoría */}
      <div className="relative h-52 shrink-0 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={provider.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENT[categorySlug] ?? CATEGORY_GRADIENT.fotografia}`}>
            <div className="absolute left-8 top-8 h-28 w-28 rounded-full border border-white/25 bg-white/10" />
            <div className="absolute bottom-6 right-6 h-24 w-16 rounded-t-full border border-white/20 bg-black/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(14,11,26,0.75))]" />

        {provider.status === 'claimed' && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <span className="size-1.5 rounded-full bg-planneo-mint" />
            Verificado
          </span>
        )}
        {provider.price_range && (
          <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {PRICE_LABEL[provider.price_range] ?? provider.price_range}
          </span>
        )}

        <div className="absolute inset-x-4 bottom-3">
          <p className="v4-mono text-[10px] text-white/65">{provider.categories?.name ?? 'Proveedor'}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="v4-display text-xl font-bold tracking-[-0.03em] text-white transition-colors group-hover:text-planneo-300">
          {provider.name}
        </h3>

        {provider.zona && (
          <p className="flex items-center gap-1.5 text-sm text-white/55">
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {provider.zona}
          </p>
        )}

        {provider.description && (
          <p className="line-clamp-2 text-sm leading-6 text-white/50">{provider.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          {provider.event_types && provider.event_types.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {provider.event_types.slice(0, 2).map((type) => (
                <span key={type} className="v4-mono rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/55">
                  {EVENT_LABEL[type] ?? type}
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-planneo-300 transition group-hover:text-white">
            Ver perfil →
          </span>
        </div>
      </div>
    </Link>
  )
}
