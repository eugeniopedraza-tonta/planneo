const guides = [
  ["BODAS · 6 MIN", "Checklist para cotizar foto y video sin sorpresas", "Preguntas clave antes de separar fecha."],
  ["XV AÑOS · 5 MIN", "Cómo armar una lista corta de música y show", "Señales para comparar ambiente, precio y logística."],
  ["CORPORATIVO · 4 MIN", "Qué pedirle a un banquete antes de confirmar", "Datos mínimos para evitar cambios de último minuto."],
];

export default function GuidesSection() {
  return (
    <section id="diario" className="bg-planneo-950 px-4 py-20 text-planneo-ink sm:px-6 lg:px-14 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <p className="v4-mono mb-4 text-[11px] text-planneo-300">{"// DIARIO"}</p>
        <h2 className="v4-display mb-12 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
          Aprende a planear <span className="v4-serif font-normal">como pro.</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {guides.map(([meta, title, excerpt]) => (
            <article key={title} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
              <div className="h-44 bg-[linear-gradient(135deg,#4A148C,#7B2CBF,#C77DFF)]" />
              <div className="p-6">
                <p className="v4-mono text-[10px] text-planneo-300">{meta}</p>
                <h3 className="v4-display mt-4 text-2xl font-bold tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{excerpt}</p>
                <span className="mt-6 inline-block text-sm font-semibold text-planneo-300">Leer guía →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
