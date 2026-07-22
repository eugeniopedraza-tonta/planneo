"use client";

import Link from "next/link";
import { useState } from "react";

const eventTypes = ["Boda", "XV Años", "Cumpleaños", "Corporativo", "Bautizo", "Otro"];

export default function HowItWorks() {
  const [selected, setSelected] = useState("Boda");

  return (
    <section id="crear-evento" className="bg-planneo-950 px-4 py-20 text-planneo-ink sm:px-6 lg:px-14 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[420px]">
          <PaperCard className="left-3 top-8 rotate-[-8deg]" step="01" title="Tipo de evento" body={selected} />
          <PaperCard className="left-16 top-24 rotate-[5deg]" step="02" title="Detalles" body="120 invitados · San Pedro" />
          <PaperCard className="left-8 top-44 rotate-[-3deg]" step="03" title="Servicios" body="Foto · Música · Catering" />
          <PaperCard className="left-20 top-64 rotate-[7deg]" step="✓" title="Listo" body="Te mostramos opciones para cotizar." />
        </div>

        <div>
          <p className="v4-mono mb-4 text-[11px] text-planneo-300">{"// CREAR EVENTO"}</p>
          <h2 className="v4-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            ¿No sabes por dónde empezar? Mejor te lo resolvemos <span className="v4-shimmer-text">nosotros.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/60">
            Elige tu tipo de evento y ve armando una lista corta de proveedores. El MVP mantiene la cotización simple: perfil claro y contacto por WhatsApp.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelected(type)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
                  selected === type
                    ? "border-planneo-300 bg-planneo-600 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <Link
            href="/proveedores"
            className="v4-cta-glow mt-8 inline-flex min-h-14 items-center justify-center rounded-[14px] bg-planneo-600 px-8 font-semibold text-white transition hover:bg-planneo-500"
          >
            Empezar mi evento
          </Link>
        </div>
      </div>
    </section>
  );
}

function PaperCard({
  className,
  step,
  title,
  body,
}: {
  className: string;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className={`absolute w-[280px] rounded-[10px] border border-[#D9D2E8] bg-[#F8F6FB] p-5 text-[#1F1B2E] shadow-2xl shadow-black/30 sm:w-[340px] ${className}`}>
      <div className="flex items-center justify-between">
        <span className="v4-mono text-[10px] text-planneo-600">{step}</span>
        <span className="size-2 rounded-full bg-planneo-mint" />
      </div>
      <h3 className="v4-display mt-5 text-2xl font-bold tracking-[-0.04em]">{title}</h3>
      <p className="mt-2 text-sm text-[#6B6478]">{body}</p>
    </div>
  );
}
