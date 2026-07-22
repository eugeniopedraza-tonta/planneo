"use client";

const TESTIMONIALS = [
  {
    quote: "Pude comparar foto, maquillaje y música sin brincar entre veinte chats distintos.",
    name: "María González",
    role: "Boda en San Pedro",
  },
  {
    quote: "Nos mostraron el perfil en una llamada y quedó listo para compartirlo con clientes.",
    name: "Carlos Méndez",
    role: "Proveedor de música",
  },
  {
    quote: "Me sirvió para ubicar proveedores regios por zona y escribirles directo.",
    name: "Roberto Sánchez",
    role: "Evento corporativo",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="bg-planneo-950 px-4 py-20 text-planneo-ink sm:px-6 lg:px-14 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="v4-mono mb-4 text-[11px] text-planneo-300">{"// TESTIMONIOS"}</p>
          <h2 className="v4-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            Quiénes ya lo usaron.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-6 text-planneo-gold" aria-label="5 estrellas">★★★★★</div>
              <p className="v4-serif text-2xl leading-snug text-white/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-8 border-t border-white/10 pt-5">
                <p className="font-semibold text-white">{t.name}</p>
                <p className="mt-1 text-sm text-white/50">{t.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
