const reasons = [
  ["Cotiza con varios", "Compara opciones sin perder el hilo en grupos y mensajes sueltos."],
  ["Solo verificados", "Perfiles curados para que sepas quién atiende y en qué zona trabaja."],
  ["Curado para MTY", "Categorías y zonas pensadas para eventos sociales en Monterrey."],
];

export default function WhyPlanneo() {
  return (
    <section className="bg-[#15101F] px-4 py-20 text-[#F5F0FF] sm:px-6 lg:px-14 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 md:grid-cols-3">
          {reasons.map(([title, body], index) => (
            <article key={title} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#7B2CBF]/20 text-[#C77DFF]">
                {index + 1}
              </div>
              <h3 className="v4-display text-2xl font-bold tracking-[-0.04em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
