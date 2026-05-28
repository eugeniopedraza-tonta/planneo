import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS } from '@/lib/constants'

const CATEGORY_META: Record<string, { emoji: string; description: string }> = {
  fotografia: { emoji: '📷', description: 'Fotógrafos y videógrafos' },
  belleza: { emoji: '💄', description: 'Maquillaje y peinado' },
  musica: { emoji: '🎵', description: 'Bandas, DJs y solistas' },
  banquete: { emoji: '🍽️', description: 'Catering y banquetes' },
  decoracion: { emoji: '🌸', description: 'Decoración y flores' },
}

async function getCategoriesWithCounts() {

  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('slug', CATEGORY_SLUGS as unknown as string[])

  if (error || !data) return []

  const counts = await Promise.all(
    data.map(async (cat) => {
      const { count } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('status', 'published')
      return { ...cat, providerCount: count ?? 0 }
    })
  )

  return counts
}

export default async function CategoriesSection() {
  const categories = await getCategoriesWithCounts()

  return (
    <section id="categorias" className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
            Explora por categoría
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Encuentra el proveedor ideal para cada aspecto de tu evento en Monterrey
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug] ?? { emoji: '✨', description: '' }
            return (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-white border border-gray-100 p-6 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#7C3AED]/30 hover:-translate-y-0.5"
              >
                <span className="text-4xl" role="img" aria-label={cat.name}>
                  {meta.emoji}
                </span>
                <div>
                  <p className="font-semibold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{meta.description}</p>
                </div>
                {cat.providerCount > 0 && (
                  <span className="text-xs font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">
                    {cat.providerCount} proveedores
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
