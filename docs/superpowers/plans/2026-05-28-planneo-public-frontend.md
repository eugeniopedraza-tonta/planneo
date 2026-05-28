# Planneo Public Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete public-facing frontend for Planneo — categories, provider listing, provider profile, and search pages — connected to real Supabase data.

**Architecture:** Server Components for all data-fetching pages with ISR (revalidate = 3600), a single Client Component for WhatsApp lead tracking, and a shared `ProviderCard` server component reused across listing and search. The homepage replaces the mock `FeaturedListings` with a real async `CategoriesSection` server component.

**Tech Stack:** Next.js 16.2.2, TypeScript, Tailwind v4, shadcn/ui (radix-ui), Supabase SSR client, Inter font (already configured).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/page.tsx` | Modify | Replace FeaturedListings import with CategoriesSection |
| `src/components/landing/categories-section.tsx` | Create | Async server component: fetch categories+counts, render grid + search bar |
| `src/components/provider-card.tsx` | Create | Reusable server component card for providers |
| `src/components/whatsapp-button.tsx` | Create | Client component: track lead + open WhatsApp |
| `src/app/[category]/page.tsx` | Create | Category listing page with sidebar filters, ISR |
| `src/app/[category]/[slug]/page.tsx` | Create | Provider profile page with JSON-LD, ISR |
| `src/app/buscar/page.tsx` | Create | Search results page, dynamic rendering |

---

### Task 1: `ProviderCard` server component

This reusable card is used by both the category listing page and the search page. Build it first so the other tasks can import it.

**Files:**
- Create: `src/components/provider-card.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ProviderWithCategory } from '@/lib/types'
import { PRICE_RANGES } from '@/lib/constants'

type Props = {
  provider: ProviderWithCategory
}

export default function ProviderCard({ provider }: Props) {
  const categorySlug = provider.categories?.slug ?? ''
  const priceLabel = PRICE_RANGES.find((p) => p.value === provider.price_range)?.label ?? provider.price_range

  return (
    <Link
      href={`/${categorySlug}/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-gray-100 shrink-0">
        {provider.photos && provider.photos.length > 0 ? (
          <Image
            src={provider.photos[0]}
            alt={provider.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#111827] text-sm leading-tight group-hover:text-[#7C3AED] transition-colors line-clamp-2">
            {provider.name}
          </h3>
          {provider.categories && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {provider.categories.name}
            </Badge>
          )}
        </div>

        {provider.zona && (
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {provider.zona}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          {priceLabel && (
            <span className="text-xs font-medium text-[#6B7280]">{priceLabel}</span>
          )}
          {provider.whatsapp && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 border border-green-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.522 5.854L.057 23.997l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.359-.213-3.72.976.993-3.63-.234-.372A9.818 9.818 0 1112 21.818z"/>
              </svg>
              WhatsApp
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles (no errors on this file)**

```bash
cd /Users/pedraza/Developer/planneo && npx tsc --noEmit --project tsconfig.json 2>&1 | grep provider-card || echo "No errors in provider-card"
```

Expected: either nothing (no errors) or the error list doesn't mention `provider-card`.

- [ ] **Step 3: Commit**

```bash
git add src/components/provider-card.tsx
git commit -m "feat: add ProviderCard server component"
```

---

### Task 2: `WhatsAppButton` client component

Tracks a `whatsapp_click` lead, and also tracks a `profile_view` on mount. Used only on the provider profile page.

**Files:**
- Create: `src/components/whatsapp-button.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect } from 'react'

type Props = {
  providerId: string
  whatsapp: string
  providerName: string
}

export default function WhatsAppButton({ providerId, whatsapp, providerName }: Props) {
  useEffect(() => {
    const sessionKey = `pv_${providerId}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, '1')
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: providerId, type: 'profile_view' }),
    }).catch(() => {})
  }, [providerId])

  function handleClick() {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: providerId, type: 'whatsapp_click' }),
    }).catch(() => {})
    window.open(`https://wa.me/${whatsapp}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-green-500 text-white font-semibold text-base px-6 py-3 hover:bg-green-600 transition-colors shadow-sm"
      aria-label={`Contactar a ${providerName} por WhatsApp`}
    >
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.522 5.854L.057 23.997l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.359-.213-3.72.976.993-3.63-.234-.372A9.818 9.818 0 1112 21.818z"/>
      </svg>
      Contactar por WhatsApp
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/whatsapp-button.tsx
git commit -m "feat: add WhatsAppButton client component with lead tracking"
```

---

### Task 3: `CategoriesSection` server component + update homepage

Replace the mock `FeaturedListings` section on the homepage with a real server component that fetches categories and provider counts.

**Files:**
- Create: `src/components/landing/categories-section.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `categories-section.tsx`**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_EMOJIS: Record<string, string> = {
  fotografia: '📷',
  belleza: '💄',
  musica: '🎵',
  banquete: '🍽️',
  decoracion: '🌸',
}

type CategoryWithCount = {
  id: string
  name: string
  slug: string
  count: number
}

async function fetchCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id, name, slug')
  if (!categories) return []

  const counts = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('status', 'published')
      return { ...cat, count: count ?? 0 }
    })
  )
  return counts
}

export default async function CategoriesSection() {
  const categories = await fetchCategoriesWithCounts()

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
            Encuentra tu proveedor en Monterrey
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-8">
            Explora las categorías de servicios para tu evento
          </p>

          <form
            action="/buscar"
            method="GET"
            className="flex max-w-xl mx-auto gap-2"
            role="search"
          >
            <input
              type="text"
              name="q"
              placeholder="Busca fotógrafos, DJ, decoradores..."
              className="flex-1 h-11 rounded-full border border-gray-200 bg-gray-50 px-5 text-sm text-[#111827] placeholder:text-[#6B7280] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-colors"
              aria-label="Buscar proveedores"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white font-semibold text-sm px-6 h-11 hover:bg-[#6D28D9] transition-colors shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 hover:border-[#7C3AED] hover:shadow-md transition-all text-center"
            >
              <span className="text-4xl" role="img" aria-label={category.name}>
                {CATEGORY_EMOJIS[category.slug] ?? '🎉'}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[#111827] text-sm group-hover:text-[#7C3AED] transition-colors capitalize">
                  {category.name}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {category.count} {category.count === 1 ? 'proveedor' : 'proveedores'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Replace the entire file content:

```tsx
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import CategoriesSection from '@/components/landing/categories-section'
import Testimonials from '@/components/landing/Testimonials'
import CTABanner from '@/components/landing/CTABanner'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <CategoriesSection />
        <Testimonials />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/categories-section.tsx src/app/page.tsx
git commit -m "feat: replace mock FeaturedListings with real CategoriesSection server component"
```

---

### Task 4: Category listing page `src/app/[category]/page.tsx`

Server Component with ISR. Sidebar filters (zona, event_type, price_range) are passed as searchParams. No client JS needed — filters use plain anchor/form links.

**Files:**
- Create: `src/app/[category]/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/pedraza/Developer/planneo/src/app/\[category\]
```

- [ ] **Step 2: Create `src/app/[category]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProviderCard from '@/components/provider-card'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { ZONAS_MTY, EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'
import type { ProviderWithCategory, EventType, PriceRange } from '@/lib/types'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ zona?: string; event_type?: string; price_range?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('name').eq('slug', category).single()
  if (!data) return {}
  return {
    title: `${data.name} en Monterrey | Planneo`,
    description: `Encuentra los mejores proveedores de ${data.name} para tu evento en Monterrey.`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params
  const { zona, event_type, price_range } = await searchParams

  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', categorySlug)
    .single()

  if (!category) notFound()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('status', 'published')
    .eq('category_id', category.id)

  if (zona) query = query.eq('zona', zona)
  if (price_range) query = query.eq('price_range', price_range as PriceRange)
  if (event_type) query = query.contains('event_types', [event_type as EventType])

  const { data: providers } = await query.order('name')
  const typedProviders = (providers ?? []) as ProviderWithCategory[]

  const baseUrl = `/${categorySlug}`

  function filterUrl(key: string, value: string, currentValue: string | undefined) {
    const params = new URLSearchParams()
    if (zona && key !== 'zona') params.set('zona', zona)
    if (event_type && key !== 'event_type') params.set('event_type', event_type)
    if (price_range && key !== 'price_range') params.set('price_range', price_range)
    if (currentValue !== value) params.set(key, value)
    const qs = params.toString()
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] capitalize">
              {category.name} en Monterrey
            </h1>
            <p className="text-[#6B7280] mt-1">
              {typedProviders.length} {typedProviders.length === 1 ? 'proveedor' : 'proveedores'} disponibles
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 shrink-0">
              <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-3">Zona</h2>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href={filterUrl('zona', '', zona)}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${!zona ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                    >
                      Todas las zonas
                    </a>
                    {ZONAS_MTY.map((z) => (
                      <a
                        key={z}
                        href={filterUrl('zona', z, zona)}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${zona === z ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {z}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-3">Tipo de evento</h2>
                  <div className="flex flex-col gap-1.5">
                    {EVENT_TYPES.map((et) => (
                      <a
                        key={et.value}
                        href={filterUrl('event_type', et.value, event_type)}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${event_type === et.value ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {et.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-3">Presupuesto</h2>
                  <div className="flex flex-col gap-1.5">
                    {PRICE_RANGES.map((pr) => (
                      <a
                        key={pr.value}
                        href={filterUrl('price_range', pr.value, price_range)}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${price_range === pr.value ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {pr.label}
                      </a>
                    ))}
                  </div>
                </div>

                {(zona || event_type || price_range) && (
                  <a
                    href={baseUrl}
                    className="text-sm text-center text-[#7C3AED] hover:underline font-medium"
                  >
                    Limpiar filtros
                  </a>
                )}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {typedProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-5xl mb-4">🔍</span>
                  <h3 className="text-lg font-semibold text-[#111827] mb-2">
                    No encontramos proveedores con estos filtros
                  </h3>
                  <p className="text-[#6B7280] mb-4">
                    Intenta ajustar los filtros o explorar todas las opciones.
                  </p>
                  <a
                    href={baseUrl}
                    className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white font-semibold text-sm px-6 py-2.5 hover:bg-[#6D28D9] transition-colors"
                  >
                    Ver todos
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {typedProviders.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/[category]/page.tsx"
git commit -m "feat: add category listing page with sidebar filters"
```

---

### Task 5: Provider profile page `src/app/[category]/[slug]/page.tsx`

Server Component with ISR, JSON-LD, `generateStaticParams`, OG metadata, WhatsApp tracking.

**Files:**
- Create: `src/app/[category]/[slug]/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "/Users/pedraza/Developer/planneo/src/app/[category]/[slug]"
```

- [ ] **Step 2: Create `src/app/[category]/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import WhatsAppButton from '@/components/whatsapp-button'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'
import type { ProviderWithCategory } from '@/lib/types'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ category: string; slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('providers')
    .select('slug, categories(slug)')
    .eq('status', 'published')
  return (
    data?.map((p) => ({
      category: (p.categories as { slug: string } | null)?.slug ?? '',
      slug: p.slug,
    })) ?? []
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('providers')
    .select('name, description, photos, categories(name, slug)')
    .eq('slug', slug)
    .single()

  if (!data) return {}

  const category = data.categories as { name: string; slug: string } | null
  const description =
    data.description ??
    `Conoce a ${data.name}, proveedor de ${category?.name ?? 'eventos'} en Monterrey.`
  const imageUrl = data.photos?.[0] ?? null

  return {
    title: `${data.name} | Planneo`,
    description,
    openGraph: {
      title: `${data.name} | Planneo`,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.name} | Planneo`,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export default async function ProviderProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { preview } = await searchParams

  const supabase = await createClient()
  const { data } = await supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('slug', slug)
    .single()

  if (!data) notFound()

  const provider = data as ProviderWithCategory

  if (provider.status !== 'published' && preview !== 'true') notFound()

  const category = provider.categories
  const priceLabel =
    PRICE_RANGES.find((p) => p.value === provider.price_range)?.label ?? provider.price_range
  const eventLabels =
    provider.event_types?.map(
      (et) => EVENT_TYPES.find((e) => e.value === et)?.label ?? et
    ) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.name,
    description: provider.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.zona ?? 'Monterrey',
      addressRegion: 'Nuevo León',
      addressCountry: 'MX',
    },
    ...(provider.photos?.[0] ? { image: provider.photos[0] } : {}),
    ...(provider.whatsapp
      ? { telephone: `+${provider.whatsapp}` }
      : {}),
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB]">
        {preview === 'true' && provider.status !== 'published' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800 font-medium">
            Vista previa — no publicado
          </div>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          {category && (
            <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6" aria-label="Breadcrumb">
              <a href="/" className="hover:text-[#7C3AED] transition-colors">Inicio</a>
              <span>/</span>
              <a href={`/${category.slug}`} className="hover:text-[#7C3AED] transition-colors capitalize">
                {category.name}
              </a>
              <span>/</span>
              <span className="text-[#111827] font-medium">{provider.name}</span>
            </nav>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                {provider.photos && provider.photos.length > 0 ? (
                  <Image
                    src={provider.photos[0]}
                    alt={provider.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg
                      className="w-20 h-20 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">{provider.name}</h1>
                  {category && (
                    <Badge className="shrink-0 bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20 capitalize">
                      {category.name}
                    </Badge>
                  )}
                </div>

                {provider.zona && (
                  <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {provider.zona}, Monterrey, NL
                  </div>
                )}

                {eventLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {eventLabels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}

                {provider.description && (
                  <p className="text-[#6B7280] leading-relaxed whitespace-pre-wrap">
                    {provider.description}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0">
              <div className="lg:sticky lg:top-24 rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-5 shadow-sm">
                <div>
                  <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Presupuesto</span>
                  <p className="text-xl font-bold text-[#111827] mt-1">{priceLabel ?? '—'}</p>
                </div>

                <hr className="border-gray-100" />

                {provider.whatsapp ? (
                  <WhatsAppButton
                    providerId={provider.id}
                    whatsapp={provider.whatsapp}
                    providerName={provider.name}
                  />
                ) : (
                  <p className="text-sm text-[#6B7280] text-center">
                    Este proveedor no tiene WhatsApp registrado.
                  </p>
                )}

                {provider.instagram_handle && (
                  <a
                    href={`https://instagram.com/${provider.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 text-[#111827] font-medium text-sm px-6 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Ver en Instagram
                  </a>
                )}

                <p className="text-xs text-center text-[#6B7280]">
                  Responde rápido · Sin intermediarios
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/[category]/[slug]/page.tsx"
git commit -m "feat: add provider profile page with JSON-LD and WhatsApp lead tracking"
```

---

### Task 6: Search page `src/app/buscar/page.tsx`

Dynamic server component. Reads `q`, `categoria`, `zona`, `evento`, `precio` from searchParams. Uses Supabase full-text search when `q` is present.

**Files:**
- Create: `src/app/buscar/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/pedraza/Developer/planneo/src/app/buscar
```

- [ ] **Step 2: Create `src/app/buscar/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProviderCard from '@/components/provider-card'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { ZONAS_MTY, EVENT_TYPES, PRICE_RANGES } from '@/lib/constants'
import type { ProviderWithCategory, EventType, PriceRange } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Buscar proveedores en Monterrey | Planneo',
  description: 'Encuentra fotógrafos, músicos, banquetes, decoradores y más para tu evento en Monterrey.',
}

type PageProps = {
  searchParams: Promise<{
    q?: string
    categoria?: string
    zona?: string
    evento?: string
    precio?: string
  }>
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const { q, categoria, zona, evento, precio } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('providers')
    .select('*, categories(id, name, slug)')
    .eq('status', 'published')

  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch', config: 'spanish' })
  }
  if (categoria) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categoria)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (zona) query = query.eq('zona', zona)
  if (precio) query = query.eq('price_range', precio as PriceRange)
  if (evento) query = query.contains('event_types', [evento as EventType])

  const { data: providers } = await query.order('name').limit(60)
  const typedProviders = (providers ?? []) as ProviderWithCategory[]

  const hasFilters = !!(q || categoria || zona || evento || precio)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const current: Record<string, string> = {}
    if (q) current['q'] = q
    if (categoria) current['categoria'] = categoria
    if (zona) current['zona'] = zona
    if (evento) current['evento'] = evento
    if (precio) current['precio'] = precio
    const merged = { ...current, ...overrides }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return qs ? `/buscar?${qs}` : '/buscar'
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <form action="/buscar" method="GET" className="flex gap-2 max-w-xl mb-6" role="search">
              {categoria && <input type="hidden" name="categoria" value={categoria} />}
              {zona && <input type="hidden" name="zona" value={zona} />}
              {evento && <input type="hidden" name="evento" value={evento} />}
              {precio && <input type="hidden" name="precio" value={precio} />}
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Busca fotógrafos, DJ, decoradores..."
                className="flex-1 h-11 rounded-full border border-gray-200 bg-white px-5 text-sm text-[#111827] placeholder:text-[#6B7280] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-colors"
                aria-label="Buscar proveedores"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white font-semibold text-sm px-6 h-11 hover:bg-[#6D28D9] transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>

            {q ? (
              <h1 className="text-xl font-bold text-[#111827]">
                Resultados para <span className="text-[#7C3AED]">&ldquo;{q}&rdquo;</span>
                {typedProviders.length > 0 && (
                  <span className="text-base font-normal text-[#6B7280] ml-2">
                    ({typedProviders.length} {typedProviders.length === 1 ? 'resultado' : 'resultados'})
                  </span>
                )}
              </h1>
            ) : (
              <h1 className="text-xl font-bold text-[#111827]">
                Todos los proveedores en Monterrey
              </h1>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-60 shrink-0">
              <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-2">Categoría</h2>
                  <div className="flex flex-col gap-1">
                    {[
                      { slug: 'fotografia', name: 'Fotografía' },
                      { slug: 'belleza', name: 'Belleza' },
                      { slug: 'musica', name: 'Música' },
                      { slug: 'banquete', name: 'Banquete' },
                      { slug: 'decoracion', name: 'Decoración' },
                    ].map((cat) => (
                      <a
                        key={cat.slug}
                        href={buildUrl({ categoria: categoria === cat.slug ? undefined : cat.slug })}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${categoria === cat.slug ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {cat.name}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-2">Zona</h2>
                  <div className="flex flex-col gap-1">
                    {ZONAS_MTY.slice(0, 6).map((z) => (
                      <a
                        key={z}
                        href={buildUrl({ zona: zona === z ? undefined : z })}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${zona === z ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {z}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-2">Tipo de evento</h2>
                  <div className="flex flex-col gap-1">
                    {EVENT_TYPES.map((et) => (
                      <a
                        key={et.value}
                        href={buildUrl({ evento: evento === et.value ? undefined : et.value })}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${evento === et.value ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {et.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#111827] mb-2">Presupuesto</h2>
                  <div className="flex flex-col gap-1">
                    {PRICE_RANGES.map((pr) => (
                      <a
                        key={pr.value}
                        href={buildUrl({ precio: precio === pr.value ? undefined : pr.value })}
                        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${precio === pr.value ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-medium' : 'text-[#6B7280] hover:bg-gray-50'}`}
                      >
                        {pr.label}
                      </a>
                    ))}
                  </div>
                </div>

                {hasFilters && (
                  <a href="/buscar" className="text-sm text-center text-[#7C3AED] hover:underline font-medium">
                    Limpiar filtros
                  </a>
                )}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {typedProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-5xl mb-4">🔍</span>
                  <h3 className="text-lg font-semibold text-[#111827] mb-2">
                    {q
                      ? `No encontramos "${q}" en Monterrey`
                      : 'No encontramos proveedores con estos filtros'}
                  </h3>
                  <p className="text-[#6B7280] mb-6">
                    {q
                      ? 'Aquí hay opciones similares — intenta con otros términos o explora por categoría.'
                      : 'Intenta ajustar los filtros para ver más resultados.'}
                  </p>
                  <a
                    href="/buscar"
                    className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white font-semibold text-sm px-6 py-2.5 hover:bg-[#6D28D9] transition-colors"
                  >
                    Ver todos los proveedores
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {typedProviders.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/buscar/page.tsx
git commit -m "feat: add search page with full-text and filter support"
```

---

### Task 7: TypeScript check and final cleanup

Verify all new files compile cleanly and there are no import errors.

**Files:** All new files

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/pedraza/Developer/planneo && npx tsc --noEmit 2>&1
```

Expected: no errors. If errors appear:
- `Type '...' is not assignable to type 'ProviderWithCategory'` — add explicit cast `as ProviderWithCategory`
- `Cannot find module '@/...'` — check the import path matches the actual file location
- `Property 'categories' does not exist` — the Supabase join returns `categories` as `{} | null`; cast with `as { slug: string; name: string } | null`

- [ ] **Step 2: Run dev build check**

```bash
cd /Users/pedraza/Developer/planneo && pnpm build 2>&1 | tail -30
```

Expected: build completes without errors. Route summary should show:
- `/` — static
- `/[category]` — ISR (revalidate 3600)  
- `/[category]/[slug]` — ISR (revalidate 3600)
- `/buscar` — dynamic

- [ ] **Step 3: Commit any type fixes, then final commit**

```bash
git add -p
git commit -m "fix: resolve TypeScript errors in public frontend pages"
```

---

## Spec Coverage Check

| Spec Requirement | Covered By |
|---|---|
| `page.tsx` — replace FeaturedListings, add CategoriesSection server component | Task 3 |
| CategoriesSection: fetch categories + counts, 5 cards, emoji icons, search bar | Task 3 |
| `[category]/page.tsx` — ISR, sidebar filters, generateMetadata | Task 4 |
| `[category]/[slug]/page.tsx` — ISR, generateStaticParams, generateMetadata, OG, JSON-LD | Task 5 |
| Provider profile: preview banner, WhatsApp button, Instagram link, photo gallery | Task 5 |
| `buscar/page.tsx` — textSearch, filters, empty state with q text | Task 6 |
| `provider-card.tsx` — reusable server component, placeholder, links | Task 1 |
| `whatsapp-button.tsx` — client component, lead tracking, sessionStorage dedup | Task 2 |
| All text in Spanish | All tasks |
| No framer-motion in new components | All tasks |
| `next/image` with proper sizes | Tasks 1, 5 |
| No `'use client'` on server components | Tasks 1, 3, 4, 5, 6 |
| `params`/`searchParams` awaited as Promises | Tasks 4, 5, 6 |
