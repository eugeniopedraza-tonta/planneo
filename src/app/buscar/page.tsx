import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import ProviderCard from '@/components/provider-card'
import type { ProviderWithCategory } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata: Metadata = {
  title: 'Buscar proveedores de eventos en Monterrey — Planneo',
  description:
    'Busca fotógrafos, música, decoración, belleza y banquetes para tu boda o evento en Monterrey y el área metropolitana.',
  alternates: { canonical: '/buscar' },
}

async function searchProviders(query: string): Promise<ProviderWithCategory[]> {

  const supabase = createStaticClient()
  const q = query.trim()
  if (!q) return []

  // FTS via search_vector (generated tsvector column, websearch_to_tsquery is injection-safe)
  const { data: ftsData, error: ftsError } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('status', 'published')
    .textSearch('search_vector', q, { type: 'websearch', config: 'spanish' })
    .limit(30)

  if (!ftsError && ftsData && ftsData.length > 0) {
    return ftsData as ProviderWithCategory[]
  }

  // ilike fallback — sanitize before interpolation, single column only
  const safeQ = q.replace(/[%,()\\*"']/g, ' ').trim().slice(0, 64)
  if (!safeQ) return []

  const { data } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('status', 'published')
    .ilike('name', `%${safeQ}%`)
    .limit(30)

  return (data ?? []) as ProviderWithCategory[]
}

function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <form method="get" action="/buscar" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Fotógrafo de bodas, DJ, decoración..."
        autoFocus
        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#111827] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 shadow-sm"
        aria-label="Buscar proveedor"
      />
      <button
        type="submit"
        className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold px-6 py-3 transition-colors shadow-sm"
      >
        Buscar
      </button>
    </form>
  )
}

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        <span className="text-5xl block mb-4" aria-hidden="true">🔍</span>
        <p>Escribe algo para comenzar tu búsqueda.</p>
      </div>
    )
  }

  const results = await searchProviders(query)

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl block mb-4" aria-hidden="true">😕</span>
        <h2 className="text-xl font-semibold text-[#111827] mb-2">Sin resultados</h2>
        <p className="text-[#6B7280] mb-6">
          No encontramos proveedores para &ldquo;{query}&rdquo;.
        </p>
        <p className="text-sm text-[#6B7280]">
          Intenta con términos más generales o{' '}
          <Link href="/" className="text-[#7C3AED] hover:underline">
            explora por categoría
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-[#6B7280] mb-5">
        {results.length} resultado{results.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </>
  )
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-4">
            Buscar proveedores
          </h1>
          <SearchForm defaultValue={q} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="text-center py-16 text-[#6B7280]">
              <p>Buscando...</p>
            </div>
          }
        >
          <SearchResults query={q} />
        </Suspense>
      </div>
    </div>
  )
}
