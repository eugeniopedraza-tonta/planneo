'use client'

import Link from 'next/link'
import { useRef } from 'react'
import ScrollEdgeFades from '@/components/catalog/scroll-edge-fades'
import { useScrollEdges } from '@/components/catalog/use-scroll-edges'

export type SubcategoryChip = {
  label: string
  href: string
  selected: boolean
}

/** Chips de subcategoría. En móvil es un carril horizontal con desvanecido; desde `sm` hace wrap. */
export default function SubcategoryChips({ chips }: { chips: SubcategoryChip[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scrollerRef)

  return (
    <div className="border-b border-white/10 bg-planneo-950/80">
      <nav aria-label="Subcategorías" className="relative mx-auto max-w-7xl">
        <ScrollEdgeFades start={edges.start} end={edges.end} fromClass="from-planneo-950" />
        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-6 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              aria-current={chip.selected ? 'page' : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300 ${
                chip.selected
                  ? 'bg-white text-planneo-950'
                  : 'border border-white/10 text-white/70 hover:border-white/25 hover:text-white'
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
