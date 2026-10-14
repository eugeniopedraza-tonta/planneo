import Link from 'next/link'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, sortByCategoryTree } from '@/lib/constants'

const CATEGORY_META: Record<string, { icon: string; description: string; kind: string }> = {
  lugares: { icon: 'VENUE', description: 'Salones, jardines y haciendas', kind: 'venue' },
  banquete: { icon: 'MENU', description: 'Catering, barra y meseros', kind: 'plate' },
  musica: { icon: 'DJ', description: 'DJs, grupos y shows', kind: 'music' },
  'foto-video': { icon: 'CAM', description: 'Fotografía, video y cabina', kind: 'camera' },
  decoracion: { icon: 'DECO', description: 'Flores, globos y ambientación', kind: 'flower' },
  mobiliario: { icon: 'SET', description: 'Mesas, carpas y equipo técnico', kind: 'furniture' },
  belleza: { icon: 'GLAM', description: 'Maquillaje, peinado y vestuario', kind: 'flower' },
  invitaciones: { icon: 'PAPER', description: 'Invitaciones, imprenta y recuerdos', kind: 'paper' },
  otros: { icon: 'MORE', description: 'Coordinación, transporte y extras', kind: 'venue' },
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

  return sortByCategoryTree(counts)
}

export default async function CategoriesSection() {
  const categories = await getCategoriesWithCounts()

  return (
    <section id="categorias" className="overflow-hidden bg-planneo-950 py-20 text-planneo-ink lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-14">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="v4-mono mb-4 text-xs text-planneo-300">{"// CATEGORÍAS"}</p>
            <h2 className="v4-display max-w-3xl text-3xl font-bold leading-[0.95] tracking-[-0.04em]">
              Todo lo que tu evento necesita. <span className="v4-shimmer-text">En un solo lugar.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-white/60">
            Empieza por la categoría más urgente, compara perfiles y escribe directo por WhatsApp.
          </p>
        </div>

        {/* Rejilla: 2 columnas en móvil (la última impar se centra), 3×3 desde sm. */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug] ?? { icon: 'EVT', description: '', kind: 'venue' }
            return (
              <li
                key={cat.id}
                className="min-w-0 max-sm:last:odd:col-span-2 max-sm:last:odd:w-[calc(50%-0.375rem)] max-sm:last:odd:justify-self-center"
              >
                <Link
                  href={`/${cat.slug}`}
                  className="group relative flex h-44 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition duration-500 hover:-translate-y-1 sm:h-56 sm:rounded-lg lg:h-64"
                >
                  <CategoryArt kind={meta.kind} seed={cat.slug} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(14,11,26,.86))]" />
                  <div className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xl sm:left-5 sm:top-5">
                    {meta.icon}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <p className="v4-display text-lg font-bold leading-tight tracking-[-0.04em] text-white sm:text-2xl">
                      {cat.name}
                    </p>
                    <p className="mt-1 hidden text-sm text-white/65 sm:block">{meta.description}</p>
                    {cat.providerCount > 0 && (
                      <span className="mt-2 inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80 backdrop-blur sm:mt-4 sm:px-3 sm:py-1">
                        {cat.providerCount} {cat.providerCount === 1 ? 'proveedor' : 'proveedores'}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="/buscar"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-planneo-300 transition hover:text-white"
          >
            Explora el catálogo completo →
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryArt({ kind, seed }: { kind: string; seed: string }) {
  const palettes: Record<string, string> = {
    lugares: 'from-[#15203A] via-[#5E17EB] to-planneo-300',
    banquete: 'from-[#2A1B12] via-[#C98B5F] to-[#FFE1A8]',
    musica: 'from-[#130F2F] via-[#5E17EB] to-planneo-mint',
    'foto-video': 'from-[#20133A] via-planneo-600 to-planneo-300',
    decoracion: 'from-[#123025] via-[#6AA884] to-[#E1F0C4]',
    mobiliario: 'from-[#2A2212] via-[#8B6B3D] to-[#E8D5A3]',
    belleza: 'from-[#3A1330] via-[#D8709B] to-[#F5C8D8]',
    invitaciones: 'from-[#2A1810] via-[#C45C26] to-[#F5C19A]',
    otros: 'from-[#1A1528] via-[#4A3F6B] to-[#C4B8E0]',
  }
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${palettes[seed] ?? palettes['foto-video']}`}>
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
