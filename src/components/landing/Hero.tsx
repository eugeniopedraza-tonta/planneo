"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Spotlight from "@/components/ui/spotlight";

const phrases = [
  { word: "evento perfecto", font: '"Fraunces", Georgia, serif', italic: true, weight: 400 },
  { word: "boda soñada", font: '"Space Grotesk", sans-serif', italic: false, weight: 700 },
  { word: "XV inolvidables", font: '"Montserrat", sans-serif', italic: false, weight: 800 },
  { word: "fiestón épico", font: '"Fraunces", Georgia, serif', italic: true, weight: 500 },
  { word: "celebración única", font: '"Inter", sans-serif', italic: false, weight: 700 },
];

const trust = [
  "Sin login para cotizar",
  "WhatsApp directo",
  "Curado para MTY",
  "Proveedores verificados",
];

export default function Hero() {
  const reduced = useReducedMotion();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const current = phrases[phraseIdx];

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setPhraseIdx((idx) => (idx + 1) % phrases.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [reduced]);

  const wordStyle = useMemo(
    () => ({
      fontFamily: current.font,
      fontStyle: current.italic ? "italic" : "normal",
      fontWeight: current.weight,
    }),
    [current]
  );

  return (
    <Spotlight className="relative min-h-[760px] overflow-hidden bg-planneo-950 pt-16 text-planneo-ink lg:min-h-[820px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(199,125,255,0.26),transparent_34%),linear-gradient(180deg,rgba(14,11,26,0.20),#0E0B1A_86%)]" />
        <VenueBackdrop />
        <div className="absolute left-[8%] top-[18%] h-52 w-52 rounded-full bg-planneo-600/35 blur-3xl [animation:v4-blob_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[18%] right-[10%] h-64 w-64 rounded-full bg-planneo-300/25 blur-3xl [animation:v4-blob_18s_ease-in-out_infinite_-6s]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(760px-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:min-h-[calc(820px-4rem)] lg:px-8 lg:py-16">
        <div className="v4-glass v4-rise mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 [animation:v4-rise_.9s_cubic-bezier(.2,.8,.2,1)_both] lg:mb-8">
          <span className="size-2 rounded-full bg-planneo-mint [animation:v4-pulse_1.8s_ease-in-out_infinite]" />
          En vivo · cotizando ahora en MTY
        </div>

        <h1 className="v4-display mx-auto flex max-w-6xl flex-col items-center gap-1 text-[clamp(2.55rem,10.5vw,7.7rem)] font-bold leading-[0.9] tracking-[-0.045em] sm:gap-2">
          <span className="block text-white">Tu</span>
          <span
            key={phraseIdx}
            style={wordStyle}
            className="block min-h-[0.95em] bg-[linear-gradient(120deg,#F5F0FF_0%,#C77DFF_48%,#06D6A0_100%)] bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(199,125,255,0.35)] [animation:v4-morph_2.8s_cubic-bezier(.2,.8,.2,1)_both]"
          >
            {current.word}
          </span>
          <span className="block text-white">
            empieza <span className="v4-serif font-normal">aquí.</span>
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-[16px] leading-7 text-white/65 sm:text-[19px] lg:mt-8 lg:leading-8">
          Encuentra salones, música, catering, foto, decoración y más proveedores para eventos sociales en Monterrey. Cotiza sin vueltas y cierra por WhatsApp.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-9">
          <Link
            href="/proveedores"
            className="v4-cta-glow inline-flex min-h-14 items-center justify-center rounded-[14px] bg-planneo-600 px-8 text-base font-semibold text-white transition hover:bg-planneo-500"
          >
            Crear mi evento
          </Link>
          <Link
            href="/proveedores"
            className="v4-glass inline-flex min-h-14 items-center justify-center rounded-[14px] px-8 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Buscar proveedores
          </Link>
        </div>

        <form
          action="/buscar"
          method="get"
          role="search"
          className="v4-glass mt-10 hidden w-full max-w-5xl grid-cols-1 gap-2 rounded-[28px] p-2 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:grid sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_.8fr_auto]"
        >
          <SearchField label="¿Qué buscas?" name="q" placeholder="Catering, DJ, salón..." />
          <SearchField label="Zona" name="zona" placeholder="San Pedro" />
          <SearchField label="Fecha" name="fecha" placeholder="Junio 2026" />
          <SearchField label="Invitados" name="invitados" placeholder="120" />
          <button className="min-h-14 rounded-[18px] bg-planneo-600 px-7 font-semibold text-white transition hover:bg-planneo-500" type="submit">
            Buscar
          </button>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/55">
          {trust.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <span className="size-1.5 rounded-full bg-planneo-mint" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </Spotlight>
  );
}

function SearchField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="flex min-h-14 flex-col justify-center rounded-[20px] px-4 transition focus-within:bg-white/[0.06]">
      <span className="v4-mono text-[10px] text-planneo-300">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-base text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

function VenueBackdrop() {
  return (
    <div className="absolute inset-x-4 top-28 mx-auto h-[500px] max-w-6xl overflow-hidden rounded-[30px] opacity-55 sm:h-[620px] sm:rounded-[36px]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#26133F_0%,#7B2CBF_42%,#C77DFF_100%)]" />
      <div className="absolute left-[12%] top-[18%] h-72 w-40 rounded-t-full border border-white/24 bg-white/8" />
      <div className="absolute left-[31%] top-[26%] h-64 w-52 rounded-t-full border border-white/20 bg-black/10" />
      <div className="absolute right-[16%] top-[16%] h-80 w-44 rounded-t-full border border-white/24 bg-white/8" />
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-[linear-gradient(180deg,transparent,rgba(14,11,26,0.88))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(255,255,255,.28),transparent_12%),radial-gradient(circle_at_72%_22%,rgba(255,255,255,.18),transparent_14%)]" />
    </div>
  );
}
