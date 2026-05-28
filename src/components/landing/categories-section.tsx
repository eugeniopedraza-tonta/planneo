import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS } from '@/lib/constants'

const CATEGORY_META: Record<string, { icon: string; description: string; kind: string }> = {
  fotografia: { icon: 'CAM', description: 'Foto y video', kind: 'camera' },
  belleza: { icon: 'GLAM', description: 'Maquillaje y peinado', kind: 'flower' },
  musica: { icon: 'DJ', description: 'DJs, grupos y solistas', kind: 'music' },
  banquete: { icon: 'MENU', description: 'Catering y banquetes', kind: 'plate' },
  decoracion: { icon: 'DECO', description: 'Ambientación y flores', kind: 'flower' },
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
        .in('status', ['published', 'claimed'])
      return { ...cat, providerCount: count ?? 0 }
    })
  )

  return counts
}

export default async function CategoriesSection() {
  const categories = await getCategoriesWithCounts()

  return (
    <section id="categorias" className="overflow-hidden bg-[#0E0B1A] py-20 text-[#F5F0FF] lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-14">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="v4-mono mb-4 text-[11px] text-[#C77DFF]">{"// CATEGORÍAS"}</p>
            <h2 className="v4-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Todo lo que tu evento necesita. <span className="v4-shimmer-text">En un solo lugar.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-white/60">
            Empieza por la categoría más urgente y guarda opciones para comparar antes de pedir cotización.
          </p>
        </div>

        <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] lg:-mx-14 lg:px-14">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug] ?? { icon: 'EVT', description: '', kind: 'venue' }
            return (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="group relative flex h-[430px] w-[78vw] max-w-[412px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition duration-500 hover:-translate-y-1.5 sm:w-[412px] lg:h-[520px]"
              >
                <CategoryArt kind={meta.kind} seed={cat.slug} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(14,11,26,.86))]" />
                <div className="absolute left-5 top-5 rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-xl">
                  {meta.icon}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="v4-display text-3xl font-bold tracking-[-0.04em] text-white lg:text-4xl">
                    {cat.name}
                  </p>
                  <p className="mt-2 text-sm text-white/65">{meta.description}</p>
                  <span className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                    {cat.providerCount} publicados
                  </span>
                </div>
              </Link>
            )
          })}
          <Link
            href="/buscar"
            className="flex h-[430px] w-[78vw] max-w-[412px] shrink-0 snap-start flex-col justify-end rounded-[24px] border border-dashed border-white/20 bg-white/[0.03] p-6 text-white transition hover:bg-white/[0.06] sm:w-[412px] lg:h-[520px]"
          >
            <p className="v4-mono text-[11px] text-[#C77DFF]">VER TODAS</p>
            <p className="v4-display mt-3 text-4xl font-bold tracking-[-0.04em]">Explora el catálogo completo.</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryArt({ kind, seed }: { kind: string; seed: string }) {
  const palettes: Record<string, string> = {
    fotografia: 'from-[#20133A] via-[#7B2CBF] to-[#C77DFF]',
    belleza: 'from-[#3A1330] via-[#D8709B] to-[#F5C8D8]',
    musica: 'from-[#130F2F] via-[#5E17EB] to-[#06D6A0]',
    banquete: 'from-[#2A1B12] via-[#C98B5F] to-[#FFE1A8]',
    decoracion: 'from-[#123025] via-[#6AA884] to-[#E1F0C4]',
  }
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${palettes[seed] ?? palettes.fotografia}`}>
      <div className="absolute inset-0 opacity-70">
        {kind === 'music' && (
          <div className="absolute inset-x-10 bottom-24 flex h-44 items-end gap-3">
            {[42, 92, 65, 120, 76, 150, 54].map((height, index) => (
              <span key={index} className="flex-1 rounded-t-full bg-white/25" style={{ height }} />
            ))}
          </div>
        )}
        {kind !== 'music' && (
          <>
            <div className="absolute left-10 top-20 h-44 w-44 rounded-full border border-white/25 bg-white/10" />
            <div className="absolute right-8 top-36 h-52 w-32 rounded-t-full border border-white/25 bg-black/10" />
            <div className="absolute bottom-28 left-1/3 h-28 w-28 rounded-full border border-white/25 bg-white/10" />
          </>
        )}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.24),transparent_12%),radial-gradient(circle_at_72%_34%,rgba(255,255,255,.16),transparent_16%)]" />
    </div>
  )
}
