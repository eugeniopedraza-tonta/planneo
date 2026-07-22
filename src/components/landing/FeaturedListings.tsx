import Link from "next/link";
import { createStaticClient } from "@/lib/supabase/server";
import type { ProviderWithCategory } from "@/lib/types";

const palettes = [
  "from-[#26133F] via-planneo-600 to-planneo-300",
  "from-[#15203A] via-[#5E17EB] to-planneo-mint",
  "from-[#2A1B12] via-[#C98B5F] to-[#FFE1A8]",
];

async function getFeaturedProviders() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("providers")
    .select("*, categories(id, name, slug)")
    .in("status", ["published", "claimed"])
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(3);

  return (data ?? []) as ProviderWithCategory[];
}

export default async function FeaturedListings() {
  const providers = await getFeaturedProviders();

  return (
    <section className="bg-planneo-950 px-4 py-20 text-planneo-ink sm:px-6 lg:px-14 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="v4-mono mb-4 text-[11px] text-planneo-300">{"// DESTACADOS"}</p>
            <h2 className="v4-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              En tendencia <span className="v4-shimmer-text">esta semana.</span>
            </h2>
          </div>
          <Link href="/proveedores" className="text-sm font-semibold text-planneo-300 transition hover:text-white">
            Ver todos →
          </Link>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-white/60">
            Publica tus primeros proveedores para que aparezcan en esta sección.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {providers.map((provider, index) => {
              const categorySlug = provider.categories?.slug ?? "proveedores";
              return (
                <article key={provider.id} className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
                  <div className={`relative h-72 overflow-hidden bg-gradient-to-br ${palettes[index % palettes.length]}`}>
                    <div className="absolute inset-0 transition duration-700 group-hover:scale-105">
                      <div className="absolute left-8 top-12 h-40 w-40 rounded-full border border-white/25 bg-white/10" />
                      <div className="absolute bottom-12 right-8 h-36 w-28 rounded-t-full border border-white/20 bg-black/10" />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(14,11,26,.82))]" />
                    {provider.status === "claimed" && (
                      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        <span className="mr-2 inline-block size-2 rounded-full bg-planneo-mint" />
                        Verificado
                      </div>
                    )}
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="v4-mono text-[10px] text-white/65">{provider.categories?.name ?? "Proveedor"}</p>
                      <h3 className="v4-display mt-1 text-3xl font-bold tracking-[-0.04em] text-white">{provider.name}</h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 text-sm text-white/60">
                      <span>{provider.zona ?? "Monterrey"}</span>
                      {provider.price_range && <span>{provider.price_range}</span>}
                    </div>
                    {provider.event_types?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {provider.event_types.slice(0, 3).map((tag) => (
                          <span key={tag} className="v4-mono rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/55">{tag}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                      <p className="text-sm text-white/50">{provider.whatsapp ? "Cotización por WhatsApp" : "Perfil publicado"}</p>
                      <Link href={`/${categorySlug}/${provider.slug}`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1F1B2E] transition hover:bg-white/90">
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
