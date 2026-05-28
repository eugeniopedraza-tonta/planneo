import Link from 'next/link'
import Image from 'next/image'
import type { ProviderWithCategory } from '@/lib/types'
import { PRICE_RANGES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ProviderCardProps {
  provider: ProviderWithCategory
}

const PRICE_LABEL: Record<string, string> = Object.fromEntries(
  PRICE_RANGES.map(({ value, label }) => [value, label])
)

export default function ProviderCard({ provider }: ProviderCardProps) {
  const photo = provider.photos?.[0] ?? null
  const categorySlug = provider.categories?.slug ?? '#'
  const href = `/${categorySlug}/${provider.slug}`

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Photo */}
      <div className="relative h-48 bg-gray-100 flex-shrink-0">
        {photo ? (
          <Image
            src={photo}
            alt={provider.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
            📷
          </div>
        )}
        {provider.price_range && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#111827] px-2 py-1 rounded-full shadow-sm">
            {PRICE_LABEL[provider.price_range] ?? provider.price_range}
          </span>
        )}
        {provider.status === 'claimed' && (
          <span className="absolute top-3 left-3 bg-[#7C3AED] text-white text-xs font-medium px-2 py-1 rounded-full">
            Verificado
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors line-clamp-1">
          {provider.name}
        </h3>

        {provider.zona && (
          <p className="text-sm text-[#6B7280] flex items-center gap-1">
            <span aria-hidden="true">📍</span>
            {provider.zona}
          </p>
        )}

        {provider.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2">{provider.description}</p>
        )}

        {provider.event_types && provider.event_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {provider.event_types.slice(0, 3).map((type) => (
              <span
                key={type}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  'bg-purple-50 text-[#7C3AED]'
                )}
              >
                {type === 'bodas' && 'Bodas'}
                {type === 'xv' && 'XV Años'}
                {type === 'corporativo' && 'Corporativo'}
                {type === 'graduacion' && 'Graduación'}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
