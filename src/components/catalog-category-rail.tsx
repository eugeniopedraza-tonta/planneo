'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import CategoryIcon from '@/components/category-icon'
import ScrollEdgeFades from '@/components/catalog/scroll-edge-fades'
import { useScrollEdges } from '@/components/catalog/use-scroll-edges'

export type CatalogCategoryRailItem = {
  slug: string
  shortName: string
  href: string
  selected: boolean
}

export default function CatalogCategoryRail({
  items,
}: {
  items: CatalogCategoryRailItem[]
}) {
  const selectedRef = useRef<HTMLAnchorElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const edges = useScrollEdges(listRef)

  useEffect(() => {
    const node = selectedRef.current
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [])

  return (
    <nav aria-label="Categorías de servicio" className="relative -mx-4 sm:-mx-6 md:mx-0">
      <ScrollEdgeFades start={edges.start} end={edges.end} fromClass="from-planneo-900" />
      <ul ref={listRef} className="flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6 md:flex-wrap md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.slug} className="snap-start">
            <Link
              ref={item.selected ? selectedRef : undefined}
              href={item.href}
              aria-current={item.selected ? 'page' : undefined}
              className={`flex min-h-11 min-w-[4.75rem] flex-col items-center gap-1.5 rounded-lg px-3 py-2.5 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 ${
                item.selected
                  ? 'bg-white/[0.1] text-white shadow-[inset_0_0_0_1px_rgba(199,125,255,0.45)]'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-full transition ${
                  item.selected
                    ? 'bg-planneo-600 text-white'
                    : 'bg-white/[0.06] text-white/70'
                }`}
              >
                {item.slug === 'todos' ? (
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                ) : (
                  <CategoryIcon slug={item.slug} className="size-5" />
                )}
              </span>
              <span className="v4-mono text-xs tracking-[0.08em]">{item.shortName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
